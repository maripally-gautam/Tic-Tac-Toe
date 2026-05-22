import 'package:flutter/material';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'sound_service.dart';

class SocketService extends ChangeNotifier {
  IO.Socket? _socket;
  SoundService? _soundService;
  bool _isConnecting = false;
  String? _networkError;
  Map<String, dynamic>? _roomState;
  String? _alertMessage;

  IO.Socket? get socket => _socket;
  bool get isConnecting => _isConnecting;
  String? get networkError => _networkError;
  Map<String, dynamic>? get roomState => _roomState;
  String? get alertMessage => _alertMessage;

  void updateSoundService(SoundService service) {
    _soundService = service;
  }

  void connectToServer(String backendUrl) {
    if (_socket != null && _socket!.connected) return;

    _isConnecting = true;
    _networkError = null;
    notifyListeners();

    _socket = IO.io(backendUrl, IO.OptionBuilder()
      .setTransports(['websocket']) // Forces WebSocket connection for speed
      .setReconnectionAttempts(5)
      .build()
    );

    _socket!.onConnect((_) {
      _isConnecting = false;
      _networkError = null;
      _soundService?.playEffect('join_lobby.wav');
      _socket!.emit('check_status');
      notifyListeners();
    });

    _socket!.onConnectError((err) {
      _isConnecting = false;
      _networkError = 'Cannot link to Battle Backend!';
      notifyListeners();
    });

    _socket!.on('roomCreated', (data) {
      _roomState = Map<String, dynamic>.from(data['roomState']);
      _soundService?.playEffect('join_lobby.wav');
      _alertMessage = null;
      notifyListeners();
    });

    _socket!.on('roomUpdated', (data) {
      _roomState = Map<String, dynamic>.from(data);
      _alertMessage = null;

      if (_roomState?['state'] == 'ended') {
        final winner = _roomState?['winner'];
        if (winner == 'draw') {
          _soundService?.playEffect('draw.wav');
        } else {
          final myId = _socket!.id;
          final playersList = List.from(_roomState?['players'] ?? []);
          final myNode = playersList.firstWhere((p) => p['id'] == myId, orElse: () => null);
          if (myNode != null && winner == myNode['symbol']) {
            _soundService?.playEffect('win.wav');
          } else {
            _soundService?.playEffect('lose.wav');
          }
        }
      }
      notifyListeners();
    });

    _socket!.on('chatUpdated', (data) {
      if (_roomState != null) {
        _roomState!['chat'] = List.from(data['chat']);
        notifyListeners();
      }
    });

    _socket!.on('opponentDisconnected', (data) {
      _soundService?.playEffect('lose.wav');
      _alertMessage = data['msg'];
      _roomState = Map<String, dynamic>.from(data['roomState']);
      notifyListeners();
      Future.delayed(const Duration(seconds: 4), () {
        _alertMessage = null;
        notifyListeners();
      });
    });

    _socket!.on('errorMsg', (msg) {
      _alertMessage = msg;
      notifyListeners();
      Future.delayed(const Duration(seconds: 3), () {
        _alertMessage = null;
        notifyListeners();
      });
    });

    _socket!.onDisconnect((_) {
      _socket = null;
      _roomState = null;
      notifyListeners();
    });
  }

  void createRoom(int boardSize) {
    _socket?.emit('createRoom', {'boardSize': boardSize});
  }

  void joinRoom(String roomId) {
    _socket?.emit('joinRoom', {'roomId': roomId});
  }

  void makeMove(String roomId, int index, String symbol) {
    _socket?.emit('makeMove', {
      'roomId': roomId,
      'index': index,
      'symbol': symbol,
    });
  }

  void sendChat(String roomId, String text) {
    _socket?.emit('sendChat', {
      'roomId': roomId,
      'text': text,
    });
    _soundService?.playEffect('chat_sent.wav');
  }

  void playAgain(String roomId) {
    _socket?.emit('playAgain', {'roomId': roomId});
  }

  void leaveRoom() {
    _socket?.disconnect();
    _socket = null;
    _roomState = null;
    notifyListeners();
  }
}
