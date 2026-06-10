(function () {
    const size = 10;
    const players = ['1', '2'];


    window.Colorito = {
        board: null,
        currentPlayer: players[0],
        gameOver: false,
        winner: null,
        moveCount: 0,
        selectedPiece: null,

        init(board) {
            if (!board) return;
            this.board = board;
            this.currentPlayer = players[0];
            this.gameOver = false;
            this.winner = null;

            document.addEventListener('boardpiececlick', (e) => this._onBoardPieceClick(e));
            document.addEventListener('piececlick', (e) => this._onPieceSelected(e));
            document.addEventListener('piecedragstart', (e) => this._onPieceSelected(e));
            document.addEventListener('piecedragend', (e) => { this.board.clearHighlights(); this.selectedPiece = null; });
            document.addEventListener('boardpiecedrop', (e) => this._onBoardPieceClick(e));
        },

        _onBoardPieceClick(e) {
            console.log('Board piece clicked:', e.detail?.boardPiece?.id);
            if (this.gameOver) return;
            if (!e.detail || !e.detail.boardPiece) return;
            const bp = e.detail.boardPiece;
            if (!bp.isEmpty()) return;
            if (!bp.highlighted) return;

            if (!this.selectedPiece) return;

            this.board.movePiece(this.board.getPositionOf(this.selectedPiece), this.board.getPositionOf(bp));

            this.selectedPiece = null;
            this.board.clearHighlights();
            this.currentPlayer = this.currentPlayer === players[0] ? players[1] : players[0];

            this.checkWinner(this.board);

            this._dispatchMoveEvent(this.winner, this.currentPlayer);
        },

        _onPieceSelected(e) {
            console.log('Piece selected:', e.detail?.piece?.id);

            board.clearHighlights();
            if (this.gameOver) return;
            if (!e.detail || !e.detail.piece) return;
            const piece = e.detail.piece;
            this.selectedPiece = piece;
            if (piece.player !== this.currentPlayer) return;

            // Desplazamiento
            const currentPos = this.board.getPositionOf(piece.boardPiece);
            const neighbors = this.board.getNeighbors(currentPos);

            for (const [dir, neighbor] of neighbors) {
                //                console.log(`Checking neighbor at direction ${dir}:`, neighbor.id);
                const neighborPos = this.board.keyToPos(dir);
                if (!neighbor?.isEmpty()) continue; // Can't move if there's a piece in the way
                if (neighbor.id.includes(piece.id.split('_')[0]) || neighbor.id.startsWith('G')) {
                    neighbor.highlighted = true;
                }

                // Desplazamiento-Salto
                const validJumps = this._jumpChain(board.keyToPos(dir), piece.id.split('_')[0]);
                validJumps.forEach(pos => {
                    const jumpTarget = this.board.getBoardPieceAt(pos);
                    if (jumpTarget) {
                        jumpTarget.highlighted = true;
                    }
                });
            }

            //Salto
            const validJumps = this._jumpChain(currentPos, piece.id.split('_')[0]);
            validJumps.forEach(pos => {
                const jumpTarget = this.board.getBoardPieceAt(pos);
                if (jumpTarget) {
                    jumpTarget.highlighted = true;
                }
            });

        },

        _jumpChain(startPos, color, visited = new Set()) {
            const key = startPos.join(',');
            if (visited.has(key)) return new Set();
            visited.add(key);

            const jumps = new Set();
            const neighbors = this.board.getNeighbors(startPos);

            for (const [, neighbor] of neighbors) {
                if (neighbor.isEmpty()) continue;

                const neighborPos = this.board.getPositionOf(neighbor);
                const jumpPos = [neighborPos[0] + (neighborPos[0] - startPos[0]),
                neighborPos[1] + (neighborPos[1] - startPos[1])];

                const jumpTarget = this.board.getBoardPieceAt(jumpPos);
                if (!jumpTarget || !jumpTarget.isEmpty()) continue;
                if (jumpTarget.id.includes(color) || jumpTarget.id.startsWith('G')) {
                    jumps.add(jumpPos);
                }

                for (const item of this._jumpChain(jumpPos, color, visited)) {
                    jumps.add(item);
                }
            }

            return jumps;
        },

        _dispatchMoveEvent(winner, player) {
            document.dispatchEvent(new CustomEvent('coloritomove', {
                detail: {
                    player: player || this.currentPlayer,
                    winner: winner || null
                }
            }));
        },

        checkWinner(board) {
            let p1OnPos = 0
            let p2OnPos = 0

            for (let i = 0; i < size; i++) {

                //Player 1 wins if all red pieces are in the top red pieces AND yellow pieces are in the bottom yellow pieces
                const player1TopPiece = board.getPieceAt([i, 0]);
                const player1BottomPiece = board.getPieceAt([i, 1]);
                if (player1TopPiece?.id.includes('red') && player1BottomPiece?.id.includes('yellow')) {
                    p1OnPos++;
                }

                //Player 2 wins if all lightBlue pieces are in the bottom lightBlue pieces AND darkBlue pieces are in the top darkBlue pieces
                const player2TopPiece = board.getPieceAt([i, size - 2]);
                const player2BottomPiece = board.getPieceAt([i, size - 1]);
                if (player2TopPiece?.id.includes('lightBlue') && player2BottomPiece?.id.includes('darkBlue')) {
                    p2OnPos++;
                }


            }
            if (p1OnPos === size) {
                this.gameOver = true;
                this.winner = '1';
            } else if (p2OnPos === size) {
                this.gameOver = true;
                this.winner = '2';
            }

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

            //Piece styles
            const redPieceStyle = new BasicStyle({ color: "#c00", shape: 0, size: 90, border: 2 })
            const redPiece = new Piece({ id: "red", player: "1", style: redPieceStyle })
            const yellowPieceStyle = new BasicStyle({ color: "#fc3", shape: 0, size: 90, border: 2 })
            const yellowPiece = new Piece({ id: "yellow", player: "1", style: yellowPieceStyle })

            const darkBluePieceStyle = new BasicStyle({ color: "#039", shape: 0, size: 90, border: 2 })
            const darkBluePiece = new Piece({ id: "darkBlue", player: "2", style: darkBluePieceStyle })
            const lightBluePieceStyle = new BasicStyle({ color: "#69f", shape: 0, size: 90, border: 2 })
            const lightBluePiece = new Piece({ id: "lightBlue", player: "2", style: lightBluePieceStyle })

            //First row contains just red pieces, second row just yellow pieces
            for (let i = 0; i < size; i++) {
                board.addPiece(darkBluePiece.clone(), [i, 0]);
                board.addPiece(lightBluePiece.clone(), [i, 1]);

                board.addPiece(yellowPiece.clone(), [i, 8]);
                board.addPiece(redPiece.clone(), [i, 9]);
            }
        }
    };

    window.initColorito = function () {
        // Orgiginal colors: c00 fc3 039 69f


        //Board Piece styles
        const redStyle = new BasicStyle({ color: "#EC9EA4" })
        const red = new BoardPiece({ id: "red", style: redStyle, clickable: true, draggable: false })

        const redGoalStyle = new BasicStyle({ color: "##f4f4f4", shape: 1, border: 5, borderColor: "#EC9EA4" })
        const redGoalPiece = new BoardPiece({ id: "G_red", style: redGoalStyle, clickable: true, draggable: false })

        const yellowStyle = new BasicStyle({ color: "#F5F3A6" })
        const yellow = new BoardPiece({ id: "yellow", style: yellowStyle, clickable: true, draggable: false })

        const yellowGoalStyle = new BasicStyle({ color: "##f4f4f4", shape: 1, border: 5, borderColor: "#F5F3A6" })
        const yellowGoalPiece = new BoardPiece({ id: "G_yellow", style: yellowGoalStyle, clickable: true, draggable: false })

        const darkBlueStyle = new BasicStyle({ color: "#7ea6f0" })
        const darkBlue = new BoardPiece({ id: "darkBlue", style: darkBlueStyle, clickable: true, draggable: false })

        const darkBlueGoalStyle = new BasicStyle({ color: "##f4f4f4", shape: 1, border: 5, borderColor: "#7ea6f0" })
        const darkBlueGoalPiece = new BoardPiece({ id: "G_darkBlue", style: darkBlueGoalStyle, clickable: true, draggable: false })

        const lightBlueStyle = new BasicStyle({ color: "#cbdbf9" })
        const lightBlue = new BoardPiece({ id: "lightBlue", style: lightBlueStyle, clickable: true, draggable: false })

        const lightBlueGoalStyle = new BasicStyle({ color: "##f4f4f4", shape: 1, border: 5, borderColor: "#cbdbf9" })
        const lightBlueGoalPiece = new BoardPiece({ id: "G_lightBlue", style: lightBlueGoalStyle, clickable: true, draggable: false })


        const matrix = [
            [redGoalPiece.clone(), redGoalPiece.clone(), redGoalPiece.clone(), redGoalPiece.clone(), redGoalPiece.clone(), redGoalPiece.clone(), redGoalPiece.clone(), redGoalPiece.clone(), redGoalPiece.clone(), redGoalPiece.clone()],
            [yellowGoalPiece.clone(), yellowGoalPiece.clone(), yellowGoalPiece.clone(), yellowGoalPiece.clone(), yellowGoalPiece.clone(), yellowGoalPiece.clone(), yellowGoalPiece.clone(), yellowGoalPiece.clone(), yellowGoalPiece.clone(), yellowGoalPiece.clone()],
            [red.clone(), yellow.clone(), darkBlue.clone(), lightBlue.clone(), red.clone(), yellow.clone(), darkBlue.clone(), lightBlue.clone(), red.clone(), yellow.clone()],
            [darkBlue.clone(), lightBlue.clone(), red.clone(), yellow.clone(), darkBlue.clone(), lightBlue.clone(), red.clone(), yellow.clone(), darkBlue.clone(), lightBlue.clone()],
            [red.clone(), yellow.clone(), darkBlue.clone(), lightBlue.clone(), red.clone(), yellow.clone(), darkBlue.clone(), lightBlue.clone(), red.clone(), yellow.clone()],
            [darkBlue.clone(), lightBlue.clone(), red.clone(), yellow.clone(), darkBlue.clone(), lightBlue.clone(), red.clone(), yellow.clone(), darkBlue.clone(), lightBlue.clone()],
            [red.clone(), yellow.clone(), darkBlue.clone(), lightBlue.clone(), red.clone(), yellow.clone(), darkBlue.clone(), lightBlue.clone(), red.clone(), yellow.clone()],
            [darkBlue.clone(), lightBlue.clone(), red.clone(), yellow.clone(), darkBlue.clone(), lightBlue.clone(), red.clone(), yellow.clone(), darkBlue.clone(), lightBlue.clone()],
            [lightBlueGoalPiece.clone(), lightBlueGoalPiece.clone(), lightBlueGoalPiece.clone(), lightBlueGoalPiece.clone(), lightBlueGoalPiece.clone(), lightBlueGoalPiece.clone(), lightBlueGoalPiece.clone(), lightBlueGoalPiece.clone(), lightBlueGoalPiece.clone(), lightBlueGoalPiece.clone()],
            [darkBlueGoalPiece.clone(), darkBlueGoalPiece.clone(), darkBlueGoalPiece.clone(), darkBlueGoalPiece.clone(), darkBlueGoalPiece.clone(), darkBlueGoalPiece.clone(), darkBlueGoalPiece.clone(), darkBlueGoalPiece.clone(), darkBlueGoalPiece.clone(), darkBlueGoalPiece.clone()]
        ]
        const board = new Board({ matrix: matrix, border: 0 })

        //Piece styles
        const redPieceStyle = new BasicStyle({ color: "#c00", shape: 0, size: 90, border: 2 })
        const redPiece = new Piece({ id: "red", player: "1", style: redPieceStyle })
        const yellowPieceStyle = new BasicStyle({ color: "#fc3", shape: 0, size: 90, border: 2 })
        const yellowPiece = new Piece({ id: "yellow", player: "1", style: yellowPieceStyle })

        const darkBluePieceStyle = new BasicStyle({ color: "#039", shape: 0, size: 90, border: 2 })
        const darkBluePiece = new Piece({ id: "darkBlue", player: "2", style: darkBluePieceStyle })
        const lightBluePieceStyle = new BasicStyle({ color: "#69f", shape: 0, size: 90, border: 2 })
        const lightBluePiece = new Piece({ id: "lightBlue", player: "2", style: lightBluePieceStyle })

        //First row contains just red pieces, second row just yellow pieces
        for (let i = 0; i < size; i++) {
            board.addPiece(darkBluePiece.clone(), [i, 0]);
            board.addPiece(lightBluePiece.clone(), [i, 1]);

            board.addPiece(yellowPiece.clone(), [i, 8]);
            board.addPiece(redPiece.clone(), [i, 9]);
        }


        if (window.Colorito && typeof window.Colorito.init === 'function') {
            window.Colorito.init(board);
        }
        return board;
    };
})();
