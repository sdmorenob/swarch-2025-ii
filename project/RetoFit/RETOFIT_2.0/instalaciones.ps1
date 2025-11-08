# instalaciones.ps1
Set-Location front
npm install

Set-Location ../services/auth-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
deactivate

Set-Location ../../services/gamification-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
deactivate

Set-Location ../../services/user-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
deactivate

Set-Location ../../services/admin-service
composer install

Set-Location ../../services/posts-service
npm install
npx prisma generate

Set-Location ../../services/physical_activities_service
go mod tidy