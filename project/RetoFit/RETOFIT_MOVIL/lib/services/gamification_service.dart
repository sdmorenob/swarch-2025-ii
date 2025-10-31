import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../models/activity_model.dart';

class GamificationService {
  String get baseUrl => dotenv.env['GAMIFICATION_API_URL']!;

  Future<bool> processActivity(ActivityRequest activity) async {
    final url = Uri.parse('$baseUrl/process-activity');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(activity.toJson()),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data["status"] == "success") {
          print("✅ Actividad registrada correctamente: ${data["message"]}");
          return true;
        } else {
          print("⚠️ Respuesta inesperada del servidor: ${response.body}");
          return false;
        }
      } else {
        print("❌ Error HTTP ${response.statusCode}: ${response.body}");
        return false;
      }
    } catch (e) {
      print("🚫 Error de conexión con gamification service: $e");
      return false;
    }
  }

  Future<double> getUserPoints(int userId) async {
    final url = Uri.parse('$baseUrl/users/$userId/points');

    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return (data['puntos_totales'] ?? 0).toDouble();
      } else {
        print("Error al obtener puntos: ${response.body}");
        return 0;
      }
    } catch (e) {
      print("Error de conexión al obtener puntos: $e");
      return 0;
    }
  }
}
