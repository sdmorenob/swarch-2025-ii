import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

class AuthService {
  final Dio _dio = Dio();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  String get baseUrl => dotenv.env['AUTH_API_URL']!;

  Future<bool> login(String email, String password) async {
    final endpoint = "$baseUrl/login";

    try {
      print("Intentando login en: $endpoint con $email / $password");
      final response = await _dio.post(
        endpoint,
        data: {"email": email, "password": password},
        options: Options(headers: {"Content-Type": "application/json"}),
      );

      print("Respuesta del backend: ${response.data}");
      if (response.statusCode == 200 && response.data["access_token"] != null) {
        final token = response.data["access_token"];
        await _storage.write(key: "access_token", value: token);

        // Decodificar token
        Map<String, dynamic> decodedToken = JwtDecoder.decode(token);
        String? userEmail = decodedToken["sub"];
        int? userId = decodedToken["id"];

        // Guardar datos
        await _storage.write(key: "user_email", value: userEmail);
        if (userId != null) {
          await _storage.write(key: "user_id", value: userId.toString());
        }

        return true;
      } else {
        if (kDebugMode) print("Respuesta inesperada: ${response.data}");
        return false;
      }
    } on DioException catch (e) {
      if (kDebugMode) print("Error de login: ${e.response?.data ?? e.message}");
      return false;
    } catch (e) {
      if (kDebugMode) print("Error inesperado: $e");
      return false;
    }
  }

  /// Leer token guardado
  Future<String?> getToken() async => await _storage.read(key: "access_token");

  /// Obtener ID desde token
  Future<int?> getUserIdFromToken() async {
    final token = await _storage.read(key: "access_token");
    if (token == null) return null;
    final decoded = JwtDecoder.decode(token);
    return decoded["id"];
  }

  /// Obtener correo
  Future<String?> getUserEmail() async => await _storage.read(key: "user_email");

  Future<void> logout() async => await _storage.deleteAll();
}
