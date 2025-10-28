#!/bin/bash

echo "🧪 Testing TaskNotes Database Setup"
echo "=================================="

# Check if docker-compose is running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Docker Compose services are not running"
    echo "Please run: docker-compose up -d"
    exit 1
fi

echo "✅ Docker Compose services are running"

# Wait for backend to be ready
echo "🔄 Waiting for backend to be ready..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    fi
    echo "⏳ Waiting for backend... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo "❌ Backend did not become ready within $timeout seconds"
    echo "📋 Backend logs:"
    docker-compose logs backend --tail=20
    exit 1
fi

# Test database connection
echo "🔄 Testing database connection..."
if docker-compose exec -T postgres psql -U user -d tasknotes -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ PostgreSQL connection successful"
else
    echo "❌ PostgreSQL connection failed"
    exit 1
fi

# Check if tables exist
echo "🔄 Checking if tables exist..."
tables=$(docker-compose exec -T postgres psql -U user -d tasknotes -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" | tr -d ' \n')

if [[ $tables == *"users"* ]] && [[ $tables == *"tasks"* ]] && [[ $tables == *"categories"* ]] && [[ $tables == *"tags"* ]]; then
    echo "✅ All required tables exist: $tables"
else
    echo "❌ Missing tables. Found: $tables"
    echo "📋 Expected: users, tasks, categories, tags"
    exit 1
fi

# Test API endpoints
echo "🔄 Testing API endpoints..."

# Test health endpoint
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Health endpoint working"
else
    echo "❌ Health endpoint failed"
    exit 1
fi

# Test API docs
if curl -f http://localhost:8000/docs > /dev/null 2>&1; then
    echo "✅ API documentation accessible"
else
    echo "❌ API documentation not accessible"
fi

echo ""
echo "🎉 Database setup test completed successfully!"
echo "📊 You can now:"
echo "   - Access the frontend: http://localhost:3000"
echo "   - Access the API docs: http://localhost:8000/docs"
echo "   - Access the search service: http://localhost:8081/health"
