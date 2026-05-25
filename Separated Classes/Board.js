/**
 * Board: Manages the state of the game board, including the placement and movement of pieces.
 * It uses a Map to store BoardPieces keyed by their position (as a string).
 */
class Board {

    /**
     * 
     * @param {Number} x Optional width of the default board
     * @param {Number} y Optional height of the default board
     * @param {Array<Array<BoardPiece|null|any>>} matrix Optional 2D array to initialize the board with specific BoardPieces or placeholders (non-null, non-BoardPiece values will be converted to default BoardPieces) 
     * @param {Style} BoardPieceStyle default style for any auto-created BoardPieces )
     */
    constructor({ x = 0, y = 0, matrix = null, BoardPieceStyle = null, background = null, gap = 6, EmptyCellStyle = null, border = null } = {}) {
        
        this._BPstyle = BoardPieceStyle || new BasicStyle();
        this._renderer = new BoardRenderer(this, { background: background, gap: gap, border: border });


        if (matrix) {
            this._board = new Map();
            for (let i = 0; i < matrix.length; i++) {
                for (let j = 0; j < matrix[i].length; j++) {
                    const bp = matrix[i][j];
                    if (bp instanceof BoardPiece) {
                        const pos = [j, i];
                        this._board.set(this._posKey(pos), bp);
                    } else if (bp) {
                        const pos = [j, i];
                        this._board.set(this._posKey(pos), new BoardPiece({ id: 'bp_' + this._board.size, style: style || new BasicStyle() }));
                    }
                }
            }
        } else if (x > 0 && y > 0) {
            this._board = new Map();
            for (let i = 0; i < y; i++) {
                for (let j = 0; j < x; j++) {
                    const pos = [j, i];
                    this._board.set(this._posKey(pos), new BoardPiece({ id: 'bp_' + this._board.size, style: this._BPstyle || new BasicStyle() }));
                }
            }
        } else {
            this._board = new Map(); // key: position string, value: BoardPiece
        }
    }

    get el() {
        return this._renderer.el;
    }

    refresh() {
        this._renderer.refresh();
    }
    
    get board() {
        return this._board;
    }

    /**
     * Helper function to convert a position array to a string key for the board map.
     * @param {Array<Number>} pos the position to convert to a string key for the board map. Expected format: [x, y]
     * @returns {String} a string key representing the position, used for storing/retrieving BoardPieces in the board map.
     */
    _posKey(pos) {
        return `${pos[0]},${pos[1]}`;
    }

    /**
     * Converts a string key back to a position array.
     * @param {String} key the string key representing the position, used for storing/retrieving BoardPieces in the board map.
     * @returns {Array<Number>} the position array corresponding to the string key. Expected format: [x, y]
     */
    _keyToPos(key) {
        return key.split(',').map(Number);
    }   

    /**
     * Adds a BoardPiece to the board at the specified position.
     * @param {BoardPiece} boardPiece the BoardPiece to add. if not provided, a default BoardPiece will be created at the position.
     * @param {Array<Number>} position the position to add the BoardPiece at. Expected format: [x, y]
     * @returns {boolean} true if the BoardPiece was added, false otherwise
     */
    addBoardPiece(boardPiece = null, position) {
        const key = this._posKey(position);
        if (this._board.has(key)) return false;
        if (!boardPiece) {
            boardPiece = new BoardPiece({ id: 'bp_' + this._board.size, style: this._BPstyle });
        }
        this._board.set(key, boardPiece);
        return true;
    }

    /**
     * Moves a BoardPiece from one position to another.
     * @param {Array<Number>} oldPos the current position of the BoardPiece. Expected format: [x, y]
     * @param {Array<Number>} newPos the new position for the BoardPiece. Expected format: [x, y]
     * @returns {boolean} true if the BoardPiece was moved, false otherwise
     */
    moveBoardPiece(oldPos, newPos) {
        const oldKey = this._posKey(oldPos);
        const newKey = this._posKey(newPos);

        if (!this._board.has(oldKey) || this._board.has(newKey)) return false;

        const bp = this._board.get(oldKey);
        if (!this.removeBoardPiece(oldKey)) {
            return false;
        }

        if (!this.addBoardPiece(bp, newPos)) {
            // rollback
            this.addBoardPiece(bp, oldPos);
            return false;
        }
        return true;
    }

    /**
     * Removes a BoardPiece from the board at the specified position.
     * @param {Array<Number>} position the position of the BoardPiece to remove. Expected format: [x, y]
     * @returns {boolean} true if the BoardPiece was removed, false otherwise
     */
    removeBoardPiece(position) {
        const key = this._posKey(position);
        return this._board.delete(key);
    }

    /**
     * 
     * @returns {Array<Piece>} an array of all pieces currently placed on the board (i.e., all non-empty BoardPieces)
     */
    piecesPlaced() {
        const pieces = [];
        for (const bp of this._board.values()) {
            if (bp.piece) pieces.push(bp.piece);
        }
        return pieces;
    }

    /**
     * Adds a piece to the board at the specified position. The position must already have a BoardPiece.
     * @param {Piece} piece the piece to add.
     * @param {Array<Number>} position the position to add the piece at. Expected format: [x, y]
     * @returns {boolean} true if the piece was added, false otherwise
     */
    addPiece(piece, position) {
        const key = this._posKey(position);
        let bp = this._board.get(key);
        if (!bp || bp.piece) return false;
        bp.addPiece(piece);
        return true;
    }

    /**
     * Moves a piece from one position to another.
     * @param {Array<Number>} oldPos the current position of the piece. Expected format: [x, y]
     * @param {Array<Number>} newPos the new position for the piece. Expected format: [x, y]
     * @param {boolean} createNewBP whether to create a new BoardPiece at the destination position if one doesn't exist. If false, the move will fail if there is no BoardPiece at the destination. Default is false.
     * @returns {boolean} true if the piece was moved, false otherwise
     */
    movePiece(oldPos, newPos, createNewBP = false) {
        const oldKey = this._posKey(oldPos);
        const newKey = this._posKey(newPos);
        const bp = this._board.get(oldKey);
        let destBp = this._board.get(newKey);
        let createdDestBP = false;

        if (!bp || !bp.piece) return false;
        if (!destBp && !createNewBP) return false;
        if (destBp && destBp.piece) return false;

        const piece = bp.piece;
        if (!bp.removePiece()) {
            return false;
        }

        if (!destBp) {
            destBp = new BoardPiece({ id: 'bp_' + this._board.size, style: new BasicStyle() });
            if (!this.addBoardPiece(newKey, destBp)) {
                // rollback
                bp.addPiece(piece);
                return false;
            }
            createdDestBP = true;
        }

        if (!destBp.addPiece(piece)) {
            // rollback
            bp.addPiece(piece);
            if (createdDestBP) {
                this.removeBoardPiece(newPos);
            }
            return false;
        }
        return true;
    }

    /**
     * 
     * @param {Array<Number>} position the position to check for a piece. Expected format: [x, y] 
     * @returns {Piece|null} the piece at the specified position, or null if there is no piece or no BoardPiece at that position
     */
    getPieceAt(position) {
        const key = this._posKey(position);
        const bp = this._board.get(key);
        return bp ? bp.piece : null;
    }

    /**
     * 
     * @param {String} player the player for whom to retrieve pieces
     * @returns {Array<Piece>} an array of all pieces on the board that belong to the specified player
     */
    getPiecesByPlayer(player) {
        let pieces = [];
        for (const bp of this._board.values()) {
            if (bp.piece && bp.piece.player === player) {
                pieces.push(bp.piece);
            }
        }
        return pieces;
    }

     /**
     * 
     * @param {Array<Number>} position the position to check for a BoardPiece. Expected format: [x, y]
     * @returns {BoardPiece|null} the BoardPiece at the specified position, or null if there is no BoardPiece at that position
     */
    getBoardPieceAt(position) {
        const key = this._posKey(position);
        return this._board.get(key) || null;
    }

    /**
     * 
     * @param {Array<Number>} position the position to check for neighbors. Expected format: [x, y]
     * @returns {Map<string, BoardPiece>} a map of neighboring BoardPieces
     */
    getNeighbors(position) {
        const [x, y] = position;
        const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        const neighbors = new Map();
        for (const [dx, dy] of deltas) {
            const pos = [x + dx, y + dy];
            const key = this._posKey(pos);
            if (this._board.has(key)) neighbors.set(key, this._board.get(key));
        }
        return neighbors;
    }

    /**
     * @param {BoardPiece} boardPiece
     * @returns {Array<number>|null}
     */
    getPositionOf(boardPiece) {
        for (const [key, piece] of this._board.entries()) {
            if (piece === boardPiece) {
                return this._keyToPos(key);
            }
        }

        return null;
    }
    /**
     * Converts the internal board representation (a Map of position keys to BoardPieces) into a 2D array (matrix) format
     * @returns {Array<Array<BoardPiece>>} a 2D array representing the board, where each element is a BoardPiece or null.
     */
    toMatrix(border = 1) {
        const entries = Array.from(this._board.entries()).map(([key, boardPiece]) => ({
            pos: this._keyToPos(key),
            boardPiece
        }));

        if (entries.length === 0) {
            return [];
        }

        const xs = entries.map(e => e.pos[0]);
        const ys = entries.map(e => e.pos[1]);

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const width = maxX - minX + 1 + border*2;
        const height = maxY - minY + 1 + border*2;

        const grid = Array.from({ length: height }, () =>
            Array.from({ length: width }, () => null)
        );

        entries.forEach(({ pos: [x, y], boardPiece }) => {
            const newX = x - minX + border;
            const newY = y - minY + border;

            grid[newY][newX] = boardPiece;
        });
        return grid;

    }
}