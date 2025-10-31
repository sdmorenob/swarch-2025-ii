import 'package:flutter/material.dart';
import '../services/gamification_service.dart';
import '../models/activity_model.dart';

class GamificationProvider extends ChangeNotifier {
  final GamificationService _service = GamificationService();

  double _points = 0;
  double get points => _points;

  bool _loading = false;
  bool get loading => _loading;

  Future<void> loadUserPoints(int userId) async {
    _loading = true;
    notifyListeners();

    _points = await _service.getUserPoints(userId);

    _loading = false;
    notifyListeners();
  }

  Future<bool> registerActivity(ActivityRequest activity) async {
    final success = await _service.processActivity(activity);
    if (success) {
      await loadUserPoints(activity.userId);
    }
    return success;
  }
}
