import 'package:flutter/material';
import 'package:audioplayers/audioplayers.dart';

class SoundService extends ChangeNotifier {
  bool _soundOn = true;
  final AudioPlayer _player = AudioPlayer();

  bool get soundOn => _soundOn;

  void toggleSound() {
    _soundOn = !_soundOn;
    playEffect('click.wav');
    notifyListeners();
  }

  Future<void> playEffect(String soundPath) async {
    if (!_soundOn) return;
    try {
      // Plays non-blocking audio cues using audioplayers packages
      await _player.play(AssetSource('sounds/$soundPath'), volume: 0.85);
    } catch (e) {
      debugPrint('Error playing synthesizer sound: $e');
    }
  }
}
