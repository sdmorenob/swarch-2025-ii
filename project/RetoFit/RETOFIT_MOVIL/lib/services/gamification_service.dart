import 'dart:io'; // Necesario para X509Certificate
import 'dart:convert';
import 'package:dio/dio.dart'; // Reemplazamos http con Dio
import 'package:dio/io.dart'; // Necesario para IOHttpClientAdapter
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../models/activity_model.dart';

class GamificationService {
  final Dio _dio = Dio(); // Instancia de Dio
  String get baseUrl => dotenv.env['GAMIFICATION_API_URL']!;

  // CONSTRUCTOR CON MANEJO DE CERTIFICADO
  GamificationService() {
    // 💡 SOLUCIÓN CRÍTICA: Permite la conexión a certificados autofirmados (Solo para DEV)
    if (_dio.httpClientAdapter is IOHttpClientAdapter) {
      (_dio.httpClientAdapter as IOHttpClientAdapter).onHttpClientCreate = (client) {
        // Ignora errores de certificado para desarrollo (necesario por Nginx/HTTPS)
        client.badCertificateCallback = (X509Certificate cert, String host, int port) => true;
        return client;
      };
    }
  }
  // ---

  Future<bool> processActivity(ActivityRequest activity) async {
    final endpoint = '$baseUrl/process-activity';

    try {
      // Uso de Dio.post
      final response = await _dio.post(
        endpoint,
        data: activity.toJson(), // Dio usa 'data' para el body y lo codifica automáticamente
        options: Options(headers: {"Content-Type": "application/json"}),
      );

      // Dio usa statusCode como int
      if (response.statusCode == 200) {
        final data = response.data; // Dio ya decodifica el JSON automáticamente
        if (data is Map && data["status"] == "success") {
          print("✅ Actividad registrada correctamente: ${data["message"]}");
          return true;
        } else {
          print("⚠️ Respuesta inesperada del servidor: ${response.data}");
          return false;
        }
      }
      // Si el estado no es 200, Dio a menudo lanza un DioException.
      // Esta verificación podría ser redundante, pero se mantiene por seguridad.
      return false;
    } on DioException catch (e) {
      print("❌ Error de processActivity: ${e.response?.data ?? e.message}");
      return false;
    } catch (e) {
      print("🚫 Error de conexión con gamification service: $e");
      return false;
    }
  }

  Future<double> getUserPoints(int userId) async {
    final endpoint = '$baseUrl/users/$userId/points';

    try {
      // Uso de Dio.get
      final response = await _dio.get(endpoint);

      if (response.statusCode == 200) {
        final data = response.data; // Dio ya decodifica el JSON
        return (data['puntos_totales'] ?? 0).toDouble();
      } else {
        print("Error al obtener puntos: ${response.data}");
        return 0;
      }
    } on DioException catch (e) {
      print("Error al obtener puntos (Dio): ${e.response?.data ?? e.message}");
      return 0;
    } catch (e) {
      print("Error de conexión al obtener puntos: $e");
      return 0;
    }
  }
}