#!/bin/bash
cd front
npm install

cd ../services/auth-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

cd ../../services/gamification-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

cd ../../services/user-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

cd ../../services/admin-service
composer install

cd ../../services/posts-service
npm install
npx prisma generate

cd ../../services/physical_activities_service
go mod tidy