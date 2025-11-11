<?php

namespace App\Routes;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Interfaces\RouteCollectorProxyInterface;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class UserRoutes
{
    public function register(RouteCollectorProxyInterface $group, Client $userServiceClient, Client $authServiceClient)
    {
        // Obtener todos los usuarios y estadísticas
        $group->get('/users', function (Request $request, Response $response, $args) use ($userServiceClient, $authServiceClient) {
            try {
            
                $authUsersResponse = $authServiceClient->get('/api/auth_admin/admin/users');
                $authUsers = $authUsersResponse->getStatusCode() === 200 ? json_decode($authUsersResponse->getBody()->getContents(), true) : [];
                $profileUsersResponse = $userServiceClient->get('/api/users_admin/admin/users');
                $profileUsers = $profileUsersResponse->getStatusCode() === 200 ? json_decode($profileUsersResponse->getBody()->getContents(), true) : [];

                $statsResponse = $authServiceClient->get('/api/auth_admin/admin/users/stats');
                $stats = $statsResponse->getStatusCode() === 200 ? json_decode($statsResponse->getBody()->getContents(), true) : ['total_users' => 0, 'active_users' => 0, 'suspended_users' => 0];

                // Crear un mapa con los detalles de perfil para una búsqueda rápida y eficiente
                $profileMap = [];
                foreach ($profileUsers as $profile) {
                    // El user-service devuelve 'id', 'username', 'email' debido a los alias de Pydantic
                    $profileMap[$profile['id']] = $profile;
                }

            } catch (GuzzleException $e) {
                error_log("Error comunicándose con auth-service en user admin: " . $e->getMessage());
                $errorPayload = json_encode(['error' => 'Error de comunicación con los microservicios: ' . $e->getMessage()]);
                $response->getBody()->write($errorPayload);
                return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
            }

            // 4. Mapear y combinar los datos de ambos servicios
            $enrichedUsers = array_map(function ($user) use ($profileMap) {
                $userId = $user['id_usuario'];
                $userDetails = $profileMap[$userId] ?? []; // Busca el perfil del usuario en el mapa
                
                $mappedUser = [
                    'id' => $userId,
                    'email' => $userDetails['email'] ?? $user['correo'] ?? null,
                    'provider' => $user['proveedor'] ?? 'local',
                    
                    'status' => $user['rol'] === 'suspended' ? 'suspended' : 'active',
                    'created_at' => $user['fecha_creacion'],
                ];
                $mappedUser['_actions'] = [
                    'view_details' => "/admin/users/{$userId}",
                    'suspend' => $mappedUser['status'] === 'active' ? "/admin/users/{$userId}/status" : null,
                    'reactivate' => $mappedUser['status'] === 'suspended' ? "/admin/users/{$userId}/status" : null,
                    'delete' => "/admin/users/{$userId}",
                ];
                return $mappedUser;
            }, $authUsers);

            $data = ['stats' => $stats, 'users' => $enrichedUsers];
            $payload = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
            $response->getBody()->write($payload);
            return $response->withHeader('Content-Type', 'application/json');
        });

        $group->post('/users', function (Request $request, Response $response, $args) use ($authServiceClient) {
            $data = $request->getParsedBody();

            if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
                $response->getBody()->write(json_encode(['error' => 'Nombre, email y contraseña son requeridos.']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            try {
                $authResponse = $authServiceClient->post('/api/auth_admin/auth/register', [
                    'json' => [
                        'name' => $data['name'],
                        'last_name' => $data['last_name'] ?? '',
                        'email' => $data['email'],
                        'password' => $data['password']
                    ]
                ]);
            } catch (GuzzleException $e) {
                $response->getBody()->write(json_encode(['error' => 'No se pudo crear el usuario: ' . $e->getMessage()]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(409);
            }

            $payload = json_encode(['message' => "Usuario '{$data['name']}' creado con éxito."]);
            $response->getBody()->write($payload);
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        });

        // Actualizar el estado de un usuario (suspender/reactivar)
        $group->patch('/users/{id}/status', function (Request $request, Response $response, $args) use ($authServiceClient) {
            $userId = $args['id'];
            $data = $request->getParsedBody();
            $newStatus = $data['status'] ?? null;

            if ($newStatus !== 'active' && $newStatus !== 'suspended') {
                $response->getBody()->write(json_encode(['error' => 'Estado no válido.']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            try {
                $authServiceClient->patch("/api/auth_admin/admin/users/{$userId}/status", [
                    'json' => ['status' => $newStatus]
                ]);
            } catch (GuzzleException $e) {
                $response->getBody()->write(json_encode(['error' => 'No se pudo actualizar el usuario: ' . $e->getMessage()]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus($e->getCode());
            }

            $action = $newStatus === 'active' ? 'reactivado' : 'suspendido';
            $payload = json_encode(['message' => "Usuario {$action} con éxito."]);
            $response->getBody()->write($payload);
            return $response->withHeader('Content-Type', 'application/json');
        });

        // Eliminar un usuario
        $group->delete('/users/{id}', function (Request $request, Response $response, $args) use ($userServiceClient, $authServiceClient) {
            $userId = $args['id'];
            
            try {
               
                $authServiceClient->delete("/api/auth_admin/admin/users/{$userId}");
                $userServiceClient->delete("/api/users_admin/admin/users/{$userId}");
            } catch (GuzzleException $e) {
                
                $response->getBody()->write(json_encode(['error' => 'No se pudo eliminar el usuario: ' . $e->getMessage()]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $payload = json_encode(['message' => 'Usuario eliminado con éxito.']);
            $response->getBody()->write($payload);
            return $response->withHeader('Content-Type', 'application/json');
        });
    }
}
