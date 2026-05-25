// Neutron game for AGLib
(function () {
    const directions = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];

    function parsePos(s) {
        if (!s) return null;
        const [x, y] = s.split(',').map(Number);
        return [x, y];
    }

    function posEqual(a, b) {
        return a[0] === b[0] && a[1] === b[1];
    }

    function withinBounds(pos, bounds) {
        return pos[0] >= bounds.minX && pos[0] <= bounds.maxX && pos[1] >= bounds.minY && pos[1] <= bounds.maxY;
    }

    // Board size and bounds. Neutron uses a fixed square board
    // (default 5x5).
    let boardsize = 5;

    function setBoardSize(n) {
        boardsize = Math.max(1, Math.floor(n) || 5);
    }

    // moves: slide in each direction to the farthest empty cell in that direction
    function getMoves(board, startPos) {
        const max = Math.max(0, boardsize - 1);
        const moves = [];
        for (const d of directions) {
            let x = startPos[0];
            let y = startPos[1];
            let moved = false;
            while (true) {
                const nx = x + d[0];
                const ny = y + d[1];
                const bp = board.getBoardPieceAt([nx, ny]);
                // consider a cell empty if there's BoardPiece at that coordinate AND the BoardPiece has no piece
                const isEmpty = (bp && bp.piece == null);
                if (isEmpty) {
                    x = nx; y = ny; moved = true;
                    continue;
                }
                break;
            }
            if (moved) moves.push([x, y]);
        }
        return moves;
    }

    // public API
    window.Neutron = {
        init(board, renderer) {
            if (!board || !renderer) return;

            this.board = board;
            this.renderer = renderer;

            // turn order: common piece (CO) then Player1 piece, then CO then Player2 piece
            this.turn = ['CO', 'P1', 'CO', 'P2'];
            this.win = false;
            this.started = false;
            this.lastMover = null;
            this._currentBindings = [];

            // Listen to custom piece events and board drops
            document.addEventListener('piececlick', (e) => this._onPieceClickEvent(e));
            document.addEventListener('piecedragstart', (e) => this._onPieceDragStart(e));
            document.addEventListener('boardpiecedrop', (e) => this._onBoardPieceDrop(e));

            // active selections
            this._activePiece = null;
            this._allowedMoves = new Set();

            this._updateDraggableStates();
        },

        _updateDraggableStates() {
            // Enable/disable dragging based on whose turn it is
            const currentPlayer = this.turn[0];
            for (const bp of this.board.board.values()) {
                if (!bp || !bp.piece) continue;
                const player = bp.piece.player;
                const isDraggable = (currentPlayer === 'CO' && player === 'CO') ||
                                    (currentPlayer !== 'CO' && player === currentPlayer);

                bp.draggable = !!isDraggable;
                if (bp.piece) bp.piece.draggable = !!isDraggable;
            }
        },

        _onPieceClickEvent(e) {
            if (this.win) return;
            const piece = e.detail.piece;
            if (!piece) return;

            // check turn
            const cur = this.turn[0];
            if (cur === 'CO') {
                if (piece.player !== 'CO') {
                    console.log(`Common piece's turn, by ${this.turn[1]} `);
                    return;
                }
            } else {
                if (piece.player !== cur) {
                    console.log(`Not your turn! It's ${cur}'s turn.`);
                    return;
                }
            }

            this._showMovesForPiece(piece);
        },

        _onPieceDragStart(e) {
            if (this.win) return;
            const piece = e.detail.piece;
            if (!piece) return;

            // check turn
            const cur = this.turn[0];
            if (cur === 'CO') {
                if (piece.player !== 'CO') {
                    return;
                }
            } else {
                if (piece.player !== cur) {
                    return;
                }
            }

            this._showMovesForPiece(piece);
        },

        _showMovesForPiece(piece) {
            this._clearMoveBindings();

            const startPos = this.board.getPositionOf(piece.boardPiece);
            if (!startPos) return;

            const moves = getMoves(this.board, startPos);
            if (!moves.length) return;

            // bind moves to renderer cells and record allowed moves
            this._activePiece = piece;
            const moveSet = new Set(moves.map(m => m.join(',')));
            this._allowedMoves = moveSet;
            this._bindMoveTargets(moves, piece);
        },

        _bindMoveTargets(moves, piece) {
            // Use library models and events: highlight BoardPiece models and listen for their `boardpiececlick` events.
            this._currentBindings = [];

            for (const m of moves) {
                const key = m.join(',');
                const pos = m; // [x,y]
                const bp = this.board.getBoardPieceAt(pos);
                if (!bp) continue;

                // use the library's highlight mechanic
                try { bp.highlighted = true; } catch (err) { /* ignore */ }

                // handler receives the boardPiece from event detail; bind per-boardPiece
                const handler = (e) => {
                    const clickedBp = e.detail && e.detail.boardPiece ? e.detail.boardPiece : bp;
                    // ensure this clicked target is one of the allowed moves
                    const posStr = (this.board.getPositionOf(clickedBp) || []).join(',');
                    if (!this._allowedMoves || !this._allowedMoves.has(posStr)) return;
                    // delegate to existing cell move logic
                    this._onCellMoveClick({ dataset: { posAbs: posStr } }, piece);
                };

                // attach listener on the element so it uses the library's event emission
                try {
                    bp.el.addEventListener('boardpiececlick', handler);
                    this._currentBindings.push({ bp, handler });
                } catch (err) {
                    // ignore
                }
            }
        },

        _onCellMoveClick(cell, piece) {
            const posAbs = parsePos(cell.dataset.posAbs);
            if (!posAbs) return;
            const oldPos = this.board.getPositionOf(piece.boardPiece);
            if (!oldPos) return;

            // validate move is allowed
            if (!this._allowedMoves || !this._allowedMoves.has(posAbs.join(','))) {
                console.warn('move not allowed', posAbs);
                return;
            }

            const ok = this.board.movePiece(oldPos, posAbs);
            if (ok) {
                this.started = true;
                if (piece.player !== 'CO') this.lastMover = piece.player;
                // refresh renderer
                this.renderer.refresh();
                this._clearMoveBindings();
                this._updateTurn();
                this._winCheck();
                
                // Dispatch custom event to notify UI of move
                document.dispatchEvent(new CustomEvent('neutronmove', {
                    detail: {
                        piece: piece,
                        from: oldPos,
                        to: posAbs,
                        winner: this.win ? (this.win === true ? 'unknown' : this.win) : null
                    }
                }));
            } else {
                // shouldn't happen
                console.warn('move failed', oldPos, posAbs);
            }
        },

        _clearMoveBindings() {
            if (!this._currentBindings) return;
            for (const b of this._currentBindings) {
                try {
                    if (b.bp) {
                        b.bp.highlighted = false;
                        b.bp.el.removeEventListener('boardpiececlick', b.handler);
                    } else if (b.cell) {
                        b.cell.removeEventListener('click', b.handler);
                    }
                } catch (err) {
                    // ignore
                }
            }
            this._currentBindings = [];
            this._activePiece = null;
            this._allowedMoves = new Set();
        },

        _onBoardPieceDrop(e) {
            // e.detail contains: boardPiece (target), sourceData (stringified dataTransfer), timestamp
            const detail = e.detail || {};
            const source = detail.sourceData;
            let pieceId = null;
            if (source) {
                try {
                    const parsed = JSON.parse(source);
                    pieceId = parsed && parsed.pieceId;
                } catch (err) {
                    // ignore parse errors
                }
            }

            // try to find piece either by active selection or by pieceId
            let piece = this._activePiece || null;
            if (!piece && pieceId) {
                const placed = this.board.piecesPlaced();
                piece = placed.find(p => p.id === pieceId) || null;
            }

            if (!piece) return;

            const targetBp = detail.boardPiece;
            if (!targetBp) return;
            const targetPos = this.board.getPositionOf(targetBp);
            if (!targetPos) return;

            if (!this._allowedMoves || !this._allowedMoves.has(targetPos.join(','))) {
                console.log('drop not allowed for target', targetPos);
                return;
            }

            const oldPos = this.board.getPositionOf(piece.boardPiece);
            if (!oldPos) return;

            const ok = this.board.movePiece(oldPos, targetPos);
            if (ok) {
                this.started = true;
                if (piece.player !== 'CO') this.lastMover = piece.player;
                this.renderer.refresh();
                this._clearMoveBindings();
                this._updateTurn();
                this._winCheck();
                document.dispatchEvent(new CustomEvent('neutronmove', {
                    detail: { piece, from: oldPos, to: targetPos }
                }));
            }
        },

        _updateTurn() {
            const t = this.turn.shift();
            this.turn.push(t);
            this._updateDraggableStates();
        },

        _winCheck() {
            // find common pieces
            const coPieces = [];
            for (const bp of this.board.board.values()) {
                if (bp && bp.piece && bp.piece.player === 'CO') coPieces.push(bp.piece);
            }

            const max = Math.max(0, boardsize - 1);

            // check if any CO on top or bottom row
            for (const p of coPieces) {
                const pos = this.board.getPositionOf(p.boardPiece);
                if (!pos) continue;
                if (pos[1] === 0) {
                    this.win = true;
                    console.log('P1 WINS: Common piece reached top row!');
                    return;
                }
                if (pos[1] === max) {
                    this.win = true;
                    console.log('P2 WINS: Common piece reached bottom row!');
                    return;
                }
            }

            // if it's CO's turn and none of the CO pieces can move, last mover wins
            if (this.turn[0] === 'CO') {
                const anyMoves = coPieces.some(p => {
                    const pos = this.board.getPositionOf(p.boardPiece);
                    return getMoves(this.board, pos).length > 0;
                });
                if (!anyMoves) {
                    this.win = true;
                    const winner = this.lastMover || 'P1';
                    console.log(`${winner} WINS: Common piece has no moves!`);
                }
            }
        }
    };

    // Create a demo board and initialize Neutron bindings. Returns the created Board.
    // This function was previously defined in the HTML demo; it's now provided here
    // so the HTML can simply call `initNeutron()`.
    window.initNeutron = function(bs = 5) {
        setBoardSize(bs);
        const board = new AGLib.Board({ x: boardsize, y: boardsize, border: 0 });

        const Player1Piece = new AGLib.Piece({ id: 'p1', player: 'P1', style: new AGLib.PolygonStyle({ color: 'red', shape: 0, size: 90 }) });
        const Player2Piece = new AGLib.Piece({ id: 'p2', player: 'P2', style: new AGLib.PolygonStyle({ color: 'blue', shape: 4, size: 90 }) });

        // place P1 on top row (y=0)
        for (let x = 0; x < boardsize; x++) {
            board.addPiece(Player1Piece.clone(), [x, 0]);
        }

        // place P2 on bottom row (y=boardsize-1)
        for (let x = 0; x < boardsize; x++) {
            board.addPiece(Player2Piece.clone(), [boardsize - 1 - x, boardsize - 1]);
        }

        // place common piece in center
        const cx = Math.floor(boardsize / 2);
        const cy = Math.floor(boardsize / 2);
        const neutron = new AGLib.Piece({ id: 'co', player: 'CO', style: new AGLib.PolygonStyle({ color: 'green', shape: 5, size: 90 }) });
        board.addPiece(neutron, [cx, cy]);

        // initialize Neutron bindings with the created board and its renderer
        if (window.Neutron && typeof window.Neutron.init === 'function') {
            window.Neutron.init(board, board._renderer);
        }

        return board;
    };

})();
