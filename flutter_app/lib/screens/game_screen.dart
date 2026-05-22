import 'package:flutter/material';
import 'package:provider/provider';
import '../services/sound_service.dart';
import '../services/socket_service.dart';
import '../theme/arcade_theme.dart';

class GameScreen extends StatefulWidget {
  final bool isOnline;
  final int boardSize;
  final bool isDarkMode;

  const GameScreen({
    super.key,
    required this.isOnline,
    required this.boardSize,
    required this.isDarkMode,
  });

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  // 1. Local Offline State
  late List<String?> _localBoard;
  String _localTurn = 'X';
  String? _localWinner;
  List<int>? _localWinningLine;

  final TextEditingController _chatController = TextEditingController();
  final ScrollController _chatScrollController = ScrollController();
  final TextEditingController _lobbyCodeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _resetLocalGame();

    if (widget.isOnline) {
      // Connects immediately to our local full-stack server on startup, with option to configure URL
      WidgetsBinding.instance.addPostFrameCallback((_) {
        // Change URL to matches deployment endpoint on Render
        Provider.of<SocketService>(context, listen: false)
            .connectToServer('http://localhost:3000');
      });
    }
  }

  void _resetLocalGame() {
    setState(() {
      _localBoard = List.generate(widget.boardSize * widget.boardSize, (_) => null);
      _localTurn = 'X';
      _localWinner = null;
      _localWinningLine = null;
    });
  }

  // Local Offline Game execution
  void _handleLocalCellTap(int idx, SoundService soundService) {
    if (_localBoard[idx] != null || _localWinner != null) return;

    soundService.playEffect(_localTurn == 'X' ? 'move_x.wav' : 'move_o.wav');

    setState(() {
      _localBoard[idx] = _localTurn;
      
      // Calculate winner
      final result = _checkWinner(_localBoard, widget.boardSize);
      if (result != null) {
        _localWinner = result['winner'];
        _localWinningLine = List<int>.from(result['line'] ?? []);
        soundService.playEffect(_localWinner == 'draw' ? 'draw.wav' : 'win.wav');

        // Automatically return home after a brief delay
        Future.delayed(const Duration(seconds: 4), () {
          if (mounted) Navigator.pop(context);
        });
      } else {
        _localTurn = _localTurn == 'X' ? 'O' : 'X';
      }
    });
  }

  Map<String, dynamic>? _checkWinner(List<String?> board, int size) {
    final winPatterns = size == 3 ? [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ] : [
      [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], // Rows
      [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], // Columns
      [0, 5, 10, 15], [3, 6, 9, 12]                                 // Diagonals
    ];

    for (final pattern in winPatterns) {
      final firstVal = board[pattern[0]];
      if (firstVal != null && pattern.every((index) => board[index] == firstVal)) {
        return {'winner': firstVal, 'line': pattern};
      }
    }

    if (board.every((cell) => cell != null)) {
      return {'winner': 'draw', 'line': null};
    }

    return null;
  }

  void _sendChat(SocketService socketService, String roomId) {
    if (_chatController.text.trim().isEmpty) return;
    socketService.sendChat(roomId, _chatController.text.trim());
    _chatController.clear();
    
    // Auto-scroll chat view to bottom
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_chatScrollController.hasClients) {
        _chatScrollController.animateTo(
          _chatScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _chatController.dispose();
    _chatScrollController.dispose();
    _lobbyCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final soundService = Provider.of<SoundService>(context);
    final socketService = Provider.of<SocketService>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.isOnline ? 'ONLINE LOBBY' : 'OFFLINE ARENA',
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.black, letterSpacing: 1.0),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            soundService.playEffect('click.wav');
            if (widget.isOnline) socketService.leaveRoom();
            Navigator.pop(context);
          },
        ),
      ),
      body: widget.isOnline
          ? _buildOnlineLayout(context, socketService, soundService)
          : _buildOfflineLayout(context, soundService),
    );
  }

  // Layout A: Offline gameplay view panel
  Widget _buildOfflineLayout(BuildContext context, SoundService soundService) {
    return SafeArea(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 16),
          _buildOfflineTurnHeader(),
          const Spacer(),
          _buildGameBoardGrid(
            board: _localBoard,
            onCellTap: (idx) => _handleLocalCellTap(idx, soundService),
            winningLine: _localWinningLine,
            enabled: _localWinner == null,
          ),
          const Spacer(),
          ElevatedButton.styleFrom(
            backgroundColor: ArcadeTheme.neonOrange.withOpacity(0.1),
            foregroundColor: ArcadeTheme.neonOrange,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ).build(context),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildOfflineTurnHeader() {
    if (_localWinner == 'draw') {
      return const Text(
        'MATCH DRAWN!',
        style: TextStyle(fontSize: 24, fontWeight: FontWeight.black, color: Colors.grey),
      );
    } else if (_localWinner != null) {
      return Text(
        'PLAYER $_localWinner WINS!',
        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.black, color: ArcadeTheme.neonOrange),
      );
    } else {
      return Text(
        'Player turn: $_localTurn',
        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
      );
    }
  }

  // Layout B: Online Socket.IO synchronized layout view panel
  Widget _buildOnlineLayout(BuildContext context, SocketService socketService, SoundService soundService) {
    if (socketService.isConnecting) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: ArcadeTheme.neonOrange),
            SizedBox(height: 16),
            Text('INITIALIZING MATRIX LINK...', style: TextStyle(fontFamily: 'monospace', fontSize: 10)),
          ],
        ),
      );
    }

    if (socketService.networkError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(socketService.networkError!, style: const TextStyle(color: ArcadeTheme.neonPink, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => socketService.connectToServer('http://localhost:3000'),
                child: const Text('RETRY CONNECTION'),
              )
            ],
          ),
        ),
      );
    }

    final room = socketService.roomState;
    if (room == null) {
      // Room matching form screen
      return SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              const Icon(Icons.wifi, color: ArcadeTheme.neonOrange, size: 48),
              const SizedBox(height: 16),
              const Text(
                'MULTIPLAYER LOBBY',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.black),
              ),
              const SizedBox(height: 48),
              
              // Action 1: Create
              Card(
                color: ArcadeTheme.neonOrange.withOpacity(0.05),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      const Text('HOST NEW GAME', style: TextStyle(fontWeight: FontWeight.bold, color: ArcadeTheme.neonOrange)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: ArcadeTheme.neonOrange,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () => socketService.createRoom(widget.boardSize),
                        child: const Text('DRAFT LOBBY CODE'),
                      )
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),
              const Text('OR CONNECT BATTLE', textAlign: TextAlign.center, style: TextStyle(fontSize: 10, color: Colors.grey)),
              const SizedBox(height: 24),

              // Action 2: Join
              TextField(
                controller: _lobbyCodeController,
                textCapitalization: TextCapitalization.characters,
                maxLength: 6,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: 'ENTER 6-DIGIT CODE',
                  counterText: '',
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  if (_lobbyCodeController.text.trim().isNotEmpty) {
                    socketService.joinRoom(_lobbyCodeController.text.trim().toUpperCase());
                  }
                },
                child: const Text('MERGE INTO ROOM'),
              )
            ],
          ),
        ),
      );
    }

    // Active Online Game board and messaging interface
    final isLobbyWaiting = room['state'] == 'waiting';
    final players = List.from(room['players'] ?? []);
    final myPlayer = players.firstWhere((p) => p['id'] == socketService.socket?.id, orElse: () => null);
    final mySymbol = myPlayer?['symbol'] ?? 'X';

    return SafeArea(
      child: Column(
        children: [
          // Alert warnings
          if (socketService.alertMessage != null)
            Container(
              padding: const EdgeInsets.all(8),
              color: ArcadeTheme.neonPink,
              width: double.infinity,
              child: Text(socketService.alertMessage!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          
          if (isLobbyWaiting)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('LOBBY CODE CREATED', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Colors.grey)),
                    const SizedBox(height: 12),
                    Text(
                      room['id'],
                      style: const TextStyle(fontSize: 32, fontWeight: FontWeight.black, letterSpacing: 4, color: ArcadeTheme.neonOrange),
                    ),
                    const SizedBox(height: 16),
                    const CircularProgressIndicator(color: ArcadeTheme.neonOrange),
                    const SizedBox(height: 16),
                    const Text('Waiting for Player 2 to join...', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                ),
              ),
            )
          else ...[
            // Game Active Header Status
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  Text('ROLE: $mySymbol', style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                  _buildOnlineTurnTitle(room, mySymbol),
                  Text('GRID: ${room['boardSize']}x${room['boardSize']}', style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                ],
              ),
            ),

            _buildGameBoardGrid(
              board: List<String?>.from(room['board']),
              onCellTap: (idx) {
                if (room['turn'] == mySymbol && room['state'] == 'playing') {
                  socketService.makeMove(room['id'], idx, mySymbol);
                }
              },
              winningLine: room['winningLine'] != null ? List<int>.from(room['winningLine'] ?? []) : null,
              enabled: room['state'] == 'playing' && room['turn'] == mySymbol,
            ),

            if (room['state'] == 'ended') ...[
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => socketService.playAgain(room['id']),
                child: const Text('REQUEST REMATCH'),
              )
            ],

            const Spacer(),

            // Chat Block
            _buildChatOverlay(room, mySymbol, socketService),
          ]
        ],
      ),
    );
  }

  Widget _buildOnlineTurnTitle(Map<String, dynamic> room, String mySymbol) {
    if (room['state'] == 'ended') {
      final winner = room['winner'];
      if (winner == 'draw') {
        return const Text('GAME DRAW!', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey));
      } else {
        return Text('WINNER: $winner', style: const TextStyle(fontWeight: FontWeight.bold, color: ArcadeTheme.neonLime));
      }
    } else {
      final isMyTurn = room['turn'] == mySymbol;
      return Text(
        isMyTurn ? 'YOUR TURN' : 'OPPONENT TURN',
        style: TextStyle(fontWeight: FontWeight.bold, color: isMyTurn ? ArcadeTheme.neonOrange : Colors.grey),
      );
    }
  }

  // Layout C: Chat Drawer overlay components
  Widget _buildChatOverlay(Map<String, dynamic> room, String mySymbol, SocketService socketService) {
    final chatArr = List.from(room['chat'] ?? []);

    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.black12,
            child: const Row(
              children: [
                Icon(Icons.message, size: 14, color: ArcadeTheme.neonOrange),
                SizedBox(width: 8),
                Text('PRIVATE MATCH CHAT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              controller: _chatScrollController,
              padding: const EdgeInsets.all(12),
              itemCount: chatArr.length,
              itemBuilder: (context, idx) {
                final bubble = chatArr[idx];
                final isMe = bubble['sender'] == mySymbol;
                return Align(
                  alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isMe ? ArcadeTheme.neonOrange : Colors.black26,
                      borderRadius: BorderRadius.circular(12).copyWith(
                        topRight: isMe ? Radius.zero : null,
                        topLeft: !isMe ? Radius.zero : null,
                      ),
                    ),
                    child: Text(
                      bubble['text'] ?? '',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _chatController,
                    decoration: const InputDecoration(
                      hintText: 'Broadcast strategy...',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(horizontal: 12),
                    ),
                    onSubmitted: (_) => _sendChat(socketService, room['id']),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send, color: ArcadeTheme.neonOrange),
                  onPressed: () => _sendChat(socketService, room['id']),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  // Master Board rendering system
  Widget _buildGameBoardGrid({
    required List<String?> board,
    required ValueChanged<int> onCellTap,
    required List<int>? winningLine,
    required bool enabled,
  }) {
    return Container(
      width: 320,
      height: 320,
      padding: const EdgeInsets.all(8),
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: widget.boardSize,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: board.length,
        itemBuilder: (context, idx) {
          final symbol = board[idx];
          final isWinning = winningLine != null && winningLine.contains(idx);

          return GestureDetector(
            onTap: enabled && symbol == null ? () => onCellTap(idx) : null,
            child: Container(
              decoration: BoxDecoration(
                color: isWinning
                    ? ArcadeTheme.neonLime.withOpacity(0.15)
                    : Colors.white.withOpacity(0.04),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isWinning
                      ? ArcadeTheme.neonLime
                      : Colors.white10,
                  width: isWinning ? 2.5 : 1.0,
                ),
              ),
              child: Center(
                child: _renderCellSymbol(symbol, isWinning),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _renderCellSymbol(String? symbol, bool isWinning) {
    if (symbol == null) return const SizedBox();

    if (symbol == 'X') {
      return Icon(
        Icons.close,
        size: widget.boardSize == 3 ? 48 : 36,
        color: isWinning ? ArcadeTheme.neonLime : ArcadeTheme.neonOrange,
      );
    } else {
      return Icon(
        Icons.radio_button_unchecked,
        size: widget.boardSize == 3 ? 44 : 32,
        color: isWinning ? ArcadeTheme.neonLime : ArcadeTheme.neonPink,
      );
    }
  }
}
