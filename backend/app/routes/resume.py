from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from supabase import Client
import fitz  # PyMuPDF
import uuid
from app.dependencies import get_supabase_client, get_user, get_admin_client
from app.models.schemas import ResumeUploadResponse

router = APIRouter(prefix="/resume", tags=["Resume"])

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    user = Depends(get_user),
    client: Client = Depends(get_admin_client)
):
    # Validate file size (10MB limit)
    MAX_SIZE = 10 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 10MB limit")
    
    # Validate file type
    filename = file.filename
    is_pdf = filename.lower().endswith(".pdf")
    is_docx = filename.lower().endswith(".docx")
    is_doc = filename.lower().endswith(".doc")
    
    if not (is_pdf or is_docx or is_doc):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a PDF or DOCX file.")
    
    # Extract text from PDF using PyMuPDF
    extracted_text = ""
    if is_pdf:
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            for page in doc:
                extracted_text += page.get_text()
            doc.close()
        except Exception as e:
            extracted_text = f"Error extracting text from PDF: {str(e)}"
    else:
        extracted_text = "Docx text extraction is simulated"

    try:
        # Upload file to Supabase Storage bucket 'resumes'
        file_path = f"{user.id}/{uuid.uuid4()}-{filename}"
        
        # Uploading requires byte content
        # Note: supabase-py storage client
        storage_res = client.storage.from_("resumes").upload(
            path=file_path,
            file=content,
            file_options={"content-type": file.content_type}
        )
        
        # Create record in resumes table
        resume_data = {
            "user_id": user.id,
            "filename": filename,
            "file_size": len(content),
            "storage_path": file_path,
            "extracted_text": extracted_text
        }
        
        res = client.table("resumes").insert(resume_data).execute()
        if not res.data or len(res.data) == 0:
            raise Exception("Failed to insert resume record into database")
        
        resume_record = res.data[0]
        
        # Update user's profile with the new resume ID
        client.table("profiles").update({"resume_id": resume_record["id"]}).eq("id", user.id).execute()
        
        return ResumeUploadResponse(
            id=resume_record["id"],
            filename=resume_record["filename"],
            fileSize=resume_record["file_size"],
            storagePath=resume_record["storage_path"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")

@router.delete("/{id}")
def delete_resume(
    id: str,
    user = Depends(get_user),
    client: Client = Depends(get_admin_client)
):
    try:
        # Get resume details to verify ownership and find storage path
        res = client.table("resumes").select("*").eq("id", id).eq("user_id", user.id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Resume not found or access denied")
        
        resume_record = res.data[0]
        storage_path = resume_record["storage_path"]
        
        # Delete from storage first
        try:
            client.storage.from_("resumes").remove([storage_path])
        except Exception as se:
            # Continue deletion even if storage remove fails (e.g. file already deleted)
            print(f"Storage deletion warning: {se}")
            
        # Update profiles table to clear resume_id association
        client.table("profiles").update({"resume_id": None}).eq("id", user.id).eq("resume_id", id).execute()
        
        # Delete from DB
        client.table("resumes").delete().eq("id", id).eq("user_id", user.id).execute()
        
        return {"status": "success", "message": "Resume successfully deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete resume: {str(e)}")
