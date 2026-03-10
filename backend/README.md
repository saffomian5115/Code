python -m venv venv
cd backend
source venv/Scripts/activate   
uvicorn main:app --reload

pip install -r requirements.txt

