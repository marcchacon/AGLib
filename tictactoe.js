(function () {
    const size = 3;
    const players = ['X', 'O'];

    function createPiece(player) {
        const style = new AGLib.PolygonStyle({
            color: player === 'X' ? '#d32f2f' : '#1976d2',
            shape: player === 'X' ? 4 : 0,
            size: 90
        });
        return new AGLib.Piece({
            id: `ttt-${player}-${Math.random().toString(16).slice(2)}`,
            player,
            style,
            clickable: false
        });
    }

    function checkWinner(board) {
        const lines = [];
        for (let i = 0; i < size; i++) {
            lines.push([[0, i], [1, i], [2, i]]);
            lines.push([[i, 0], [i, 1], [i, 2]]);
        }
        lines.push([[0, 0], [1, 1], [2, 2]]);
        lines.push([[2, 0], [1, 1], [0, 2]]);

        for (const line of lines) {
            const values = line.map(pos => {
                const piece = board.getPieceAt(pos);
                return piece ? piece.player : null;
            });
            if (values[0] && values[0] === values[1] && values[1] === values[2]) {
                return values[0];
            }
        }
        return null;
    }

    function isBoardFull(board) {
        for (const bp of board.board.values()) {
            if (!bp.piece) return false;
        }
        return true;
    }

    window.TicTacToe = {
        board: null,
        currentPlayer: players[0],
        gameOver: false,
        winner: null,
        moveCount: 0,

        init(board) {
            if (!board) return;
            this.board = board;
            this.currentPlayer = players[0];
            this.gameOver = false;
            this.winner = null;
            this.moveCount = 0;

            document.addEventListener('boardpiececlick', (e) => this._onBoardPieceClick(e));
        },

        _onBoardPieceClick(e) {
            if (this.gameOver) return;
            const bp = e.detail && e.detail.boardPiece;
            if (!bp || !bp.isEmpty()) return;

            const pos = this.board.getPositionOf(bp);
            if (!pos) return;

            const movedPlayer = this.currentPlayer;
            const piece = createPiece(movedPlayer);
            const added = this.board.addPiece(piece, pos);
            if (!added) return;

            this.moveCount += 1;
            this.board.refresh();

            const winner = checkWinner(this.board);
            if (winner) {
                this.gameOver = true;
                this.winner = winner;
                this._dispatchMoveEvent(pos, winner, false, movedPlayer);
                return;
            }

            if (isBoardFull(this.board)) {
                this.gameOver = true;
                this.winner = null;
                this._dispatchMoveEvent(pos, null, true, movedPlayer);
                return;
            }

            this.currentPlayer = this.currentPlayer === players[0] ? players[1] : players[0];
            this._dispatchMoveEvent(pos, null, false, movedPlayer);
        },

        _dispatchMoveEvent(position, winner, draw, player) {
            document.dispatchEvent(new CustomEvent('tictactoemove', {
                detail: {
                    player: player || this.currentPlayer,
                    position,
                    winner: winner || null,
                    draw: !!draw
                }
            }));
        },

        reset() {
            if (!this.board) return;
            for (const bp of this.board.board.values()) {
                if (bp.piece) {
                    bp.removePiece();
                }
            }
            this.currentPlayer = players[0];
            this.gameOver = false;
            this.winner = null;
            this.moveCount = 0;
            this.board.refresh();
        }
    };

    window.initTicTacToe = function () {
        const board = new AGLib.Board({ x: size, y: size, border: 0 });
        if (window.TicTacToe && typeof window.TicTacToe.init === 'function') {
            window.TicTacToe.init(board);
        }
        return board;
    };
})();
