<?php
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Factory\AppFactory;
use App\Routes\ChallengeRoutes;
use App\Routes\UserRoutes;
use GuzzleHttp\Client;

require __DIR__ . '/../vendor/autoload.php';


$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../'); 
$dotenv->load();

//base retos
$dbChallengesUrl = parse_url($_ENV['CHALLENGES_DATABASE_URL']);
$dbChallengesHost = $dbChallengesUrl['host'];
$dbChallengesPort = $dbChallengesUrl['port'];
$dbChallengesName = ltrim($dbChallengesUrl['path'], '/');
$dbChallengesUser = $dbChallengesUrl['user'];
$dbChallengesPass = $dbChallengesUrl['pass'];

$dsnChallenges = "pgsql:host=$dbChallengesHost;port=$dbChallengesPort;dbname=$dbChallengesName";
$pdo_challenges = new PDO($dsnChallenges, $dbChallengesUser, $dbChallengesPass);
$pdo_challenges->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// --- Cliente HTTP para user service
$userServiceClient = new Client([
    'base_uri' => $_ENV['USER_SERVICE_URL'] ?? 'http://localhost:8080/api/users_admin',
    'timeout'  => 5.0,
]);
// --- Cliente HTTP para auth service
$authServiceClient = new Client([
    'base_uri' => $_ENV['AUTH_SERVICE_URL'] ?? 'http://localhost:8080/api/auth_admin',
    'timeout'  => 5.0,
]);

$app = AppFactory::create();


$app->addBodyParsingMiddleware();

$app->options('/{routes:.+}', function ($request, $response, $args) {
    return $response;
});

// Middleware para añadir cabeceras CORS a todas las respuestas
$app->add(function (Request $request, $handler) {
    $response = $handler->handle($request);
    return $response
            ->withHeader('Access-control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
});

$app->addRoutingMiddleware();

$app->get('/', function (Request $request, Response $response, $args) {
    $response->getBody()->write("¡Hola desde el Admin Service en PHP!");
    return $response;
});

// MOdulos
$app->group('/admin', function ($group) use ($userServiceClient, $authServiceClient, $pdo_challenges) {
    // Ruta para las estadísticas del dashboard
    $group->get('/dashboard-stats', function (Request $request, Response $response) use ($userServiceClient, $authServiceClient, $pdo_challenges) {
        try {
            // Petición al auth-service para obtener el conteo de usuarios registrados.
            $authServiceResponse = $authServiceClient->get('/api/auth_admin/admin/users/stats');
            $userStats = json_decode($authServiceResponse->getBody()->getContents(), true);
            $totalUsers = $userStats['total_users'] ?? 0;

            // Petición a la base de datos de retos (propia de este contexto, por ahora)
            $challengeStmt = $pdo_challenges->query('SELECT COUNT(*) as total FROM challenges');
            $totalChallenges = $challengeStmt->fetchColumn();

            $stats = ['total_users' => (int)$totalUsers, 'total_challenges' => (int)$totalChallenges];
            $response->getBody()->write(json_encode($stats));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (PDOException $e) {
            error_log("Error DB (challenges): " . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Error de base de datos al obtener estadísticas de retos: ' . $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        } catch (\GuzzleHttp\Exception\GuzzleException $e) {
            error_log("Error comunicándose con auth-service: " . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Error de comunicación con el servicio de autenticación: ' . $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    // Ruta para las analíticas de registro de usuarios
    $group->get('/analytics/user-registrations', function (Request $request, Response $response) use ($authServiceClient) {
        try {
           // Este endpoint ahora existe en el auth-service $authServiceResponse = $authServiceClient->get('/admin/analytics/user-registrations');
            $data = json_decode($authServiceResponse->getBody()->getContents(), true);

            $response->getBody()->write(json_encode($data));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\GuzzleHttp\Exception\GuzzleException $e) {
            $response->getBody()->write(json_encode(['error' => 'Error al obtener datos de analíticas desde el servicio de autenticación: ' . $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    // Ruta para las analíticas de datos de usuario
    $group->get('/analytics/users', function (Request $request, Response $response) use ($userServiceClient) {
        try {
            // Llama al nuevo endpoint en el user-service
            $userServiceResponse = $userServiceClient->get('/api/users_admin/admin/analytics/users');
            $data = json_decode($userServiceResponse->getBody()->getContents(), true);

            $response->getBody()->write(json_encode($data));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\GuzzleHttp\Exception\GuzzleException $e) {
            $response->getBody()->write(json_encode(['error' => 'Error de comunicación con el servicio de usuarios: ' . $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });
    $userRoutes = new UserRoutes();
    $userRoutes->register($group, $userServiceClient, $authServiceClient);
    
    $challengeRoutes = new ChallengeRoutes();
    $challengeRoutes->register($group, $pdo_challenges);
});

$app->run();
