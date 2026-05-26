(function () {
    const W = 5, H = 4;
    const players = ['P1', 'P2'];
    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];


    const Player1BaseStyle = new AGLib.PolygonStyle({ color: '#a66', size: 80 });
    const Player2BaseStyle = new AGLib.PolygonStyle({ color: '#66a', size: 80, shape: 4 });

    const Player1FlippedStyle = new AGLib.PolygonStyle({ color: '#d22', size: 80 });
    const Player2FlippedStyle = new AGLib.PolygonStyle({ color: '#22d', size: 80, shape: 4 });

    function createPiece(player) {
        const p = new AGLib.Piece({
            id: `karo-${player}-${Math.random().toString(16).slice(2)}`,
            player: player,
            style: player === 'P1' ? Player1BaseStyle.clone() : Player2BaseStyle.clone(),
            clickable: true
        });

        p.flipped = false;
        return p;
    }

    window.Karo = {
        board: null,
        currentPlayer: players[0],
        phase: 'placement',
        counts: { P1: 0, P2: 0 },
        moveStep: 'piece', // 'piece' or 'boardpiece'
        selectedPiece: null,
        selectedBoardPiecePos: null,
        lockedBoardPieceKey: null,
        lockedBy: null,
        gameOver: false,
        winner: null,


        init(board) {
            if (!board) return;
            this.board = board;
            this.currentPlayer = players[0];
            this.phase = 'placement';
            this.counts = { P1: 0, P2: 0 };
            this.moveStep = 'piece';
            this.selectedPiece = null;
            this.selectedBoardPiecePos = null;
            this.lockedBoardPieceKey = null;
            this.lockedBy = null;
            this.gameOver = false;
            this.winner = null;

            // listen for clicks on pieces, boardPieces and cells
            document.addEventListener('piececlick', (e) => this._onPieceSelected(e));
            document.addEventListener('piecedragstart', (e) => this._onPieceSelected(e));
            document.addEventListener('boardpiececlick', (e) => this._onBoardPieceClick(e));
            document.addEventListener('boardpiecedrop', (e) => this._onBoardPieceClick(e));
            document.addEventListener('boardpiecedragstart', (e) => this._onBoardPieceClick(e));

        },

        reset() {
            // recreate full board
            this.board._board = new Map();
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                this.board._board.set(posKey([x, y]), new AGLib.BoardPiece({ id: `bp_${x}_${y}`, style: new AGLib.BasicStyle({ color: 'transparent', size: 100 }) }));
            }
            this.board.refresh();
            this.init(this.board);
            document.dispatchEvent(new CustomEvent('karomove', { detail: { type: 'reset', info: 'board reset' } }));
        },

        _onPieceSelected(e) {
            if (this.gameOver) return;

            const piece = e.detail && e.detail.piece;
            if (!piece) return;

            // During placement phase, only allow placing new pieces on empty board pieces.
            if (this.phase === 'placement') return;

            if (piece.player !== this.currentPlayer) return;
            if (this.moveStep !== 'piece') return;


            // select piece
            this.selectedPiece = piece;
            this.board.clearHighlights();

            const curPos = this.board.getPositionOf(piece.boardPiece);

            if (!curPos) return;
            const neighbors = this.board.getNeighbors(curPos);

            neighbors.forEach((nbp, key) => {

                //console.log('neighbor key', key, nbp);

                if (!nbp) return;

                if (nbp.isEmpty()) {
                    nbp.highlighted = true;

                } else if (nbp.piece && nbp.piece.player !== piece.player) {

                    const [x, y] = curPos;
                    const [nx, ny] = key.split(',').map(Number);

                    const beyond = [
                        nx + (nx - x),
                        ny + (ny - y)
                    ];

                    const b2 = this.board.getBoardPieceAt(beyond);
                    if (b2 && b2.isEmpty()) {
                        b2.highlighted = true;
                    }
                }
            });

        },

        _onBoardPieceClick(e) {
            if (this.gameOver) return;

            const bp = e.detail.boardPiece;
            const pos = this.board.getPositionOf(bp);

            if (!bp.isEmpty()) return;

            if (this.phase === 'placement') {

                const piece = createPiece(this.currentPlayer);
                const added = this.board.addPiece(piece, pos);
                if (!added) return;
                this.counts[this.currentPlayer]++;
                this._nextPlayerAfterPlacement();
                return;
            } else if (this.moveStep === 'piece') {
                if (!bp.highlighted) return;

                const curPos = this.board.getPositionOf(this.selectedPiece.boardPiece);

                const moved = this.board.movePiece(curPos, pos, false);
                if (!moved) return;

                const isJump = this._isJumpMove(curPos, pos);
                if (isJump) {
                    this.selectedPiece.flipped = !this.selectedPiece.flipped;
                    if (this.selectedPiece.flipped) {
                        this.selectedPiece.style = this.selectedPiece.player === 'P1' ? Player1FlippedStyle : Player2FlippedStyle;
                    } else {
                        this.selectedPiece.style = this.selectedPiece.player === 'P1' ? Player1BaseStyle : Player2BaseStyle;
                    }
                }

                this.selectedPiece = null;
                this.board.clearHighlights();

                this.winnerCheck();

                this.addDraggableBoardPieces();
                this.removeDragablePieces();

                this.moveStep = 'boardpiece';
                document.dispatchEvent(new CustomEvent('karomove', { detail: { type: 'move', step: 'boardpiece' } }));
            } else if (this.moveStep === 'boardpiece') {
                console.log('elegible?', this._isBoardPieceEligible(pos));
                if (!this._isBoardPieceEligible(pos)) return;

                //get external positions that have at least 1 orthogonal side with a boardPiece and highlight them as possible moves
                this.selectedBoardPiecePos = pos;
                this.board.clearHighlights();

                const external = this.board.getExteriorSpaces();
                external.forEach(blankSpace => {
                    const blankPos = this.board.keyToPos(blankSpace)
                    const neighbors = this.board.getNeighbors(blankPos, { diagonal: false });
                    neighbors.delete(this.board.posKey(pos));
                    if (neighbors.size > 0) {
                        this.board.highlightEmptyCell(blankPos);
                        this.board.el.addEventListener('emptyspaceclick', (e) => this._onCellClick(e));
                        this.board.el.addEventListener('emptyspacedrop', (e) => this._onCellClick(e));

                    }
                });
            }
        },

        _onCellClick(e) {
            if (this.gameOver) return;

            const cell = e.detail.cell;
            if (!cell) return;

            const pos = e.detail.pos;

            if (this.moveStep === 'boardpiece') {
                if (!this.selectedBoardPiecePos) return;
                if (!cell.dataset.highlighted || cell.dataset.highlighted === 'false') return;

                this.board.moveBoardPiece(this.selectedBoardPiecePos, pos);
                this.lockedBoardPieceKey = this.board.posKey(pos);

                this.selectedBoardPiecePos = null;
                this.board.clearHighlights();

                this.board.el.removeEventListener('emptyspaceclick', (e) => this._onCellClick(e));
                this.board.el.removeEventListener('emptyspacedrop', (e) => this._onCellClick(e));

                this._endPlayerTurn();
            }
        },

        _nextPlayerAfterPlacement() {
            // check if both have 6
            if (this.counts.P1 >= 6 && this.counts.P2 >= 6) {
                this.phase = 'movement';
                this.moveStep = 'piece';
                this.currentPlayer = players[0];
                document.dispatchEvent(new CustomEvent('karomove', { detail: { type: 'phase-change', info: 'movement phase begins' } }));
                return;
            }
            // switch player
            this.currentPlayer = this.currentPlayer === players[0] ? players[1] : players[0];
            document.dispatchEvent(new CustomEvent('karomove', { detail: { type: 'turn', player: this.currentPlayer } }));
        },

        _endPlayerTurn() {
            // clear any selected states
            this.selectedPiece = null;
            this.selectedBoardPiecePos = null;
            this.moveStep = 'piece';

            // switch player
            this.currentPlayer = this.currentPlayer === players[0] ? players[1] : players[0];

            this.addDragablePieces();
            this.removeDraggableBoardPieces();

            document.dispatchEvent(new CustomEvent('karomove', { detail: { type: 'turn', player: this.currentPlayer } }));
        },

        _isJumpMove(from, to) {
            const dx = to[0] - from[0];
            const dy = to[1] - from[1];
            return Math.abs(dx) > 1 || Math.abs(dy) > 1;
        },

        _isBoardPieceEligible(pos) {
            const bp = this.board.getBoardPieceAt(pos);
            if (!bp) return false;
            if (!bp.isEmpty()) return false;

            // must have at least two orthogonal free sides (no BoardPiece present)
            let free = 4 - this.board.getNeighbors(pos, { diagonal: false }).length;
            if (free < 2) return false;

            // not allowed if removing splits board
            if (this.board.wouldDisconnectIfRemoved(pos, { diagonal: false })) return false;

            // not allowed if moved last turn by opponent (locked)
            const key = this.board.posKey(pos);
            if (this.lockedBoardPieceKey && this.lockedBoardPieceKey === key) return false;

            // must be exterior
            return this.board.isExteriorBoardPiece(pos);
        },

        _clearHighlights() {
            for (const bp of this.board.board.values()) {
                bp.highlighted = false
            }
        },

        //A player wins if he has a 4-in-a-row of flipped pieces in any direction (orthogonal or diagonal). 
        winnerCheck() {
            const pieces = this.board.piecesPlaced().filter(p => p.flipped && p.player === this.currentPlayer);
            const positions = pieces.map(p => this.board.getPositionOf(p.boardPiece));
            const posSet = new Set(positions.map(pos => this.board.posKey(pos)));

            for (const pos of positions) {
                for (const delta of deltas) {
                    let count = 1;
                    let nextPos = [pos[0] + delta[0], pos[1] + delta[1]];
                    while (posSet.has(this.board.posKey(nextPos))) {
                        count++;
                        if (count >= 4) {
                            this.gameOver = true;
                            this.winner = this.currentPlayer;
                            return true;
                        }
                        nextPos = [nextPos[0] + delta[0], nextPos[1] + delta[1]];
                    }
                }
            }

            return false;
        },

        removeDragablePieces() {
            for (const piece of this.board.piecesPlaced()) {
                piece.draggable = false;
            }

            document.removeEventListener('piececlick', (e) => this._onPieceSelected(e));
            document.removeEventListener('piecedragstart', (e) => this._onPieceSelected(e));
            document.removeEventListener('boardpiecedrop', (e) => this._onBoardPieceClick(e));

        },

        addDragablePieces() {
            for (const piece of this.board.piecesPlaced()) {
                piece.draggable = true;
            }

            document.addEventListener('piececlick', (e) => this._onPieceSelected(e));
            document.addEventListener('piecedragstart', (e) => this._onPieceSelected(e));
            document.addEventListener('boardpiecedrop', (e) => this._onBoardPieceClick(e));

        },

        removeDraggableBoardPieces() {
            for (const bp of this.board.board.values()) {
                bp.draggable = false;
            }

            document.removeEventListener('boardpiececlick', (e) => this._onBoardPieceClick(e));
            document.removeEventListener('emptyspaceclick', (e) => this._onCellClick(e));
            document.removeEventListener('boardpiecedragstart', (e) => this._onBoardPieceClick(e));
            document.removeEventListener('emptyspacedrop', (e) => this._onCellClick(e));
        },

        addDraggableBoardPieces() {
            for (const bp of this.board.board.values()) {
                bp.draggable = true;
            }

            document.addEventListener('boardpiececlick', (e) => this._onBoardPieceClick(e));
            document.addEventListener('emptyspaceclick', (e) => this._onCellClick(e));
            document.addEventListener('boardpiecedragstart', (e) => this._onBoardPieceClick(e));
            document.addEventListener('emptyspacedrop', (e) => this._onCellClick(e));
        }
    };

    window.initKaro = function () {
        const board = new AGLib.Board({ x: W, y: H, border: 1 });
        if (window.Karo && typeof window.Karo.init === 'function') {
            window.Karo.init(board);
        }
        return board;
    };
})();
