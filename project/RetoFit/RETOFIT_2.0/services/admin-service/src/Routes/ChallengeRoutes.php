<?php

namespace App\Routes;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Interfaces\RouteCollectorProxyInterface;
use PDOException;
use PDO;

class ChallengeRoutes
{
    public function register(RouteCollectorProxyInterface $group, PDO $pdo)
    {
        // Endpoint para crear un nuevo reto
        $group->post('/challenges', function (Request $request, Response $response) use ($pdo) {
            $data = $request->getParsedBody();

            // Validación simple
            if (empty($data['name']) || empty($data['type']) || empty($data['target'])) {
                $response->getBody()->write(json_encode(['error' => 'Los campos nombre, tipo y objetivo son obligatorios.']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $sql = "INSERT INTO challenges (name, description, type, target, unit, start_date, end_date, image_url) 
                    VALUES (:name, :description, :type, :target, :unit, :start_date, :end_date, :image_url)";

            try {
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':name' => $data['name'],
                    ':description' => $data['description'] ?? null,
                    ':type' => $data['type'],
                    ':target' => (int)$data['target'],
                    ':unit' => $data['unit'] ?? null,
                    ':start_date' => $data['start_date'] ?? null,
                    ':end_date' => $data['end_date'] ?? null,
                    ':image_url' => $data['image_url'] ?? null,
                ]);

                $newChallengeId = $pdo->lastInsertId();
                $stmt = $pdo->prepare("SELECT * FROM challenges WHERE id = ?");
                $stmt->execute([$newChallengeId]);
                $newChallenge = $stmt->fetch();

                $response->getBody()->write(json_encode($newChallenge));
                return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
            } catch (PDOException $e) {
                $response->getBody()->write(json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
        });

        // Endpoint para listar todos los retos
        $group->get('/challenges', function (Request $request, Response $response) use ($pdo) {
            try {
                $stmt = $pdo->query("SELECT * FROM challenges ORDER BY created_at DESC");
                $challenges = $stmt->fetchAll();
                $response->getBody()->write(json_encode($challenges));
                return $response->withHeader('Content-Type', 'application/json');
            } catch (PDOException $e) {
                $response->getBody()->write(json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
        });

        // Endpoint para actualizar un reto
        $group->put('/challenges/{id}', function (Request $request, Response $response, array $args) use ($pdo) {
            $id = $args['id'];
            $data = $request->getParsedBody();

            if (empty($data['name']) || empty($data['type']) || empty($data['target'])) {
                $response->getBody()->write(json_encode(['error' => 'Los campos nombre, tipo y objetivo son obligatorios.']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $sql = "UPDATE challenges SET 
                        name = :name, description = :description, type = :type, 
                        target = :target, unit = :unit, start_date = :start_date, 
                        end_date = :end_date, image_url = :image_url 
                    WHERE id = :id";

            try {
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $id,
                    ':name' => $data['name'],
                    ':description' => $data['description'] ?? null,
                    ':type' => $data['type'],
                    ':target' => (int)$data['target'],
                    ':unit' => $data['unit'] ?? null,
                    ':start_date' => $data['start_date'] ?? null,
                    ':end_date' => $data['end_date'] ?? null,
                    ':image_url' => $data['image_url'] ?? null,
                ]);

                $stmt = $pdo->prepare("SELECT * FROM challenges WHERE id = ?");
                $stmt->execute([$id]);
                $updatedChallenge = $stmt->fetch();

                $response->getBody()->write(json_encode($updatedChallenge));
                return $response->withHeader('Content-Type', 'application/json');
            } catch (PDOException $e) {
                $response->getBody()->write(json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
        });

        // Endpoint para eliminar un reto
        $group->delete('/challenges/{id}', function (Request $request, Response $response, array $args) use ($pdo) {
            $id = $args['id'];
            try {
                $stmt = $pdo->prepare("DELETE FROM challenges WHERE id = :id");
                $stmt->execute([':id' => $id]);
                $response->getBody()->write(json_encode(['message' => 'Reto eliminado exitosamente']));
                return $response->withHeader('Content-Type', 'application/json');
            } catch (PDOException $e) {
                $response->getBody()->write(json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
        });

        // Endpoint para obtener un reto específico por ID
        $group->get('/challenges/{id}', function (Request $request, Response $response, array $args) use ($pdo) {
            $id = $args['id'];
            try {
                $stmt = $pdo->prepare("SELECT * FROM challenges WHERE id = ?");
                $stmt->execute([$id]);
                $challenge = $stmt->fetch(PDO::FETCH_ASSOC); // Usar FETCH_ASSOC

                if ($challenge) {
                    // Aquí podrías necesitar transformar los datos si el frontend espera un formato específico
                    // Por ejemplo, el frontend espera un objeto `image`
                    $challenge['image'] = [
                        'imageUrl' => $challenge['image_url'] ?? '/default-image.jpg',
                        'description' => $challenge['name'], // O un campo de descripción de imagen si lo tienes
                        'imageHint' => 'image for ' . $challenge['name']
                    ];
                    // El frontend también espera 'participants', 'target', 'unit'
                    // Asumimos que 'target' y 'unit' ya están bien
                    // 'participants' necesitaría otra consulta, por ahora lo simulamos
                    $challenge['participants'] = []; // Necesitarías una consulta real aquí

                    $response->getBody()->write(json_encode($challenge));
                    return $response->withHeader('Content-Type', 'application/json');
                } else {
                    $response->getBody()->write(json_encode(['error' => 'Reto no encontrado.']));
                    return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
                }
            } catch (PDOException $e) {
                $response->getBody()->write(json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
        });

        $group->get('/challenges/{id}/progress/{userId}', function (Request $request, Response $response, array $args) use ($pdo) {
            try {
                $stmt = $pdo->prepare("SELECT * FROM progress_logs WHERE challenge_id = :challenge_id AND user_id = :user_id");
                $stmt->execute([
                    ':challenge_id' => $args['id'],
                    ':user_id' => $args['userId']
                ]);
                $progress = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($progress) {
                    $response->getBody()->write(json_encode($progress));
                    return $response->withHeader('Content-Type', 'application/json');
                } else {
                    // Si no existe, devolvemos un progreso por defecto (0)
                    $defaultProgress = [
                        'challenge_id' => (int)$args['id'],
                        'user_id' => $args['userId'],
                        'progress' => 0,
                    ];
                    $response->getBody()->write(json_encode($defaultProgress));
                    return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
                }
            } catch (PDOException $e) {
                $response->getBody()->write(json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
        });

        /**
         * Endpoint para ACTUALIZAR (crear/modificar) el progreso de un usuario
         */
        $group->patch('/challenges/{id}/progress/{userId}', function (Request $request, Response $response, array $args) use ($pdo) {
            $data = $request->getParsedBody();
            $newProgress = $data['progress'] ?? null;

            if ($newProgress === null || !is_numeric($newProgress) || $newProgress < 0) {
                $response->getBody()->write(json_encode(['error' => 'Se requiere un "progress" numérico válido.']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Usamos "INSERT ... ON CONFLICT" (Upsert) para crear o actualizar el registro
            $sql = "INSERT INTO progress_logs (challenge_id, user_id, progress) 
                    VALUES (:challenge_id, :user_id, :progress)
                    ON CONFLICT (challenge_id, user_id) 
                    DO UPDATE SET progress = :progress, updated_at = CURRENT_TIMESTAMP
                    RETURNING *"; // RETURNING * devuelve la fila actualizada

            try {
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':challenge_id' => (int)$args['id'],
                    ':user_id' => $args['userId'],
                    ':progress' => (int)$newProgress
                ]);
                
                $updatedProgress = $stmt->fetch(PDO::FETCH_ASSOC);
                $response->getBody()->write(json_encode($updatedProgress));
                return $response->withHeader('Content-Type', 'application/json');

            } catch (PDOException $e) {
                $response->getBody()->write(json_encode(['error' => 'Error al guardar el progreso: ' . $e->getMessage()]));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
        });

        

    }
}
