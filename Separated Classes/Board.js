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
                        this._board.set(this.posKey(pos), bp);
                    } else if (bp) {
                        const pos = [j, i];
                        this._board.set(this.posKey(pos), new BoardPiece({ id: 'bp_' + this._board.size, style: this._BPstyle  || new BasicStyle() }));
                    }
                }
            }
        } else if (x > 0 && y > 0) {
            this._board = new Map();
            for (let i = 0; i < y; i++) {
                for (let j = 0; j < x; j++) {
                    const pos = [j, i];
                    this._board.set(this.posKey(pos), new BoardPiece({ id: 'bp_' + this._board.size, style: this._BPstyle || new BasicStyle() }));
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
    posKey(pos) {
        return `${pos[0]},${pos[1]}`;
    }

    /**
     * Converts a string key back to a position array.
     * @param {String} key the string key representing the position, used for storing/retrieving BoardPieces in the board map.
     * @returns {Array<Number>} the position array corresponding to the string key. Expected format: [x, y]
     */
    keyToPos(key) {
        return key.split(',').map(Number);
    }

    /**
     * Adds a BoardPiece to the board at the specified position.
     * @param {BoardPiece} boardPiece the BoardPiece to add. if not provided, a default BoardPiece will be created at the position.
     * @param {Array<Number>} position the position to add the BoardPiece at. Expected format: [x, y]
     * @returns {boolean} true if the BoardPiece was added, false otherwise
     */
    addBoardPiece(boardPiece = null, position) {
        const key = this.posKey(position);
        if (this._board.has(key)) return false;
        if (!boardPiece) {
            boardPiece = new BoardPiece({ id: 'bp_' + this._board.size, style: this._BPstyle });
        }
        this._board.set(key, boardPiece);

        this.refresh();
        return true;
    }

    /**
     * Moves a BoardPiece from one position to another.
     * @param {Array<Number>} oldPos the current position of the BoardPiece. Expected format: [x, y]
     * @param {Array<Number>} newPos the new position for the BoardPiece. Expected format: [x, y]
     * @returns {boolean} true if the BoardPiece was moved, false otherwise
     */
    moveBoardPiece(oldPos, newPos) {
        const oldKey = this.posKey(oldPos);
        const newKey = this.posKey(newPos);

        if (!this._board.has(oldKey) || this._board.has(newKey)) return false;

        const bp = this._board.get(oldKey);
        if (!this.removeBoardPiece(oldPos)) {
            return false;
        }

        if (!this.addBoardPiece(bp, newPos)) {
            // rollback
            this.addBoardPiece(bp, oldPos);
            return false;
        }

        this.refresh();
        return true;
    }

    /**
     * Removes a BoardPiece from the board at the specified position.
     * @param {Array<Number>} position the position of the BoardPiece to remove. Expected format: [x, y]
     * @returns {boolean} true if the BoardPiece was removed, false otherwise
     */
    removeBoardPiece(position) {
        const key = this.posKey(position);
        if (!this._board.has(key)) return false;

        this.refresh();
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
        const key = this.posKey(position);
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
        const oldKey = this.posKey(oldPos);
        const newKey = this.posKey(newPos);
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
     * Removes a piece from the board at the specified position.
     * @param {Array<Number>} position the position of the piece to remove. Expected format: [x, y]
     * @returns {boolean} true if the piece was removed, false otherwise
     */
    removePiece(position) {
        const key = this.posKey(position);
        const bp = this._board.get(key);
        if (!bp || !bp.piece) return false;
        return bp.removePiece();
    }
    /**
     * 
     * @param {Array<Number>} position the position to check for a piece. Expected format: [x, y] 
     * @returns {Piece|null} the piece at the specified position, or null if there is no piece or no BoardPiece at that position
     */
    getPieceAt(position) {
        const key = this.posKey(position);
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
     * @param {String} id the id of the BoardPiece to retrieve
     * @returns {BoardPiece|null} the BoardPiece with the specified id, or null if no such BoardPiece exists on the board
     */
    getBoardPieceById(id) {
        for (const bp of this._board.values()) {
            if (bp.id === id) {
                return bp;
            }
        }
        return null;
    }

    /**
    * 
    * @param {Array<Number>} position the position to check for a BoardPiece. Expected format: [x, y]
    * @returns {BoardPiece|null} the BoardPiece at the specified position, or null if there is no BoardPiece at that position
    */
    getBoardPieceAt(position) {
        const key = this.posKey(position);
        return this._board.get(key) || null;
    }

    /**
     * gets the neighboring BoardPieces surrounding a given position. Diagonal neighbors are included.
     * @param {Array<Number>} position the position to check for neighbors. Expected format: [x, y]
     * @returns {Map<string, BoardPiece>} a map of neighboring BoardPieces
     */
    getNeighbors(position, { orthogonal = true, diagonal = true } = {}) {
        const [x, y] = position;
        let deltas = [];
        if (orthogonal) {
            deltas.push([1, 0], [-1, 0], [0, 1], [0, -1]);
        }
        if (diagonal) {
            deltas.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
        }
        const neighbors = new Map();
        for (const [dx, dy] of deltas) {
            const pos = [x + dx, y + dy];
            const key = this.posKey(pos);
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
                return this.keyToPos(key);
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
            pos: this.keyToPos(key),
            boardPiece
        }));

        if (entries.length === 0) {
            return [];
        }

        const { minX, maxX, minY, maxY } = this.getBounds();

        const width = maxX - minX + 1 + border * 2;
        const height = maxY - minY + 1 + border * 2;

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

    /**
     * gets the min and max x and y coordinates of the board based on the positions of the BoardPieces.
     * @returns {Object} 
     */
    getBounds() {

        const positions = Array.from(this._board.keys())
            .map(k => this.keyToPos(k));

        if (!positions.length) {
            return null;
        }

        return {
            minX: Math.min(...positions.map(p => p[0])),
            maxX: Math.max(...positions.map(p => p[0])),
            minY: Math.min(...positions.map(p => p[1])),
            maxY: Math.max(...positions.map(p => p[1]))
        };

    }

    /**
     * Returns the relative position based on the current board layout, given an absolute position.
     * @param {Array<Number>} pos the absolute position to check. Expected format: [x, y] 
     * @param {Number} border the border size for the matrix, default is 1 (i.e., the matrix will have a border of 1 empty cell around the actual board pieces)
     * @returns {Array<Number>|null} the position in matrix coordinates, or null if the position is out of bounds
     * @example board.absToRelativePos([-1, -1]) // returns the position of [1, 1], asuming it's the top-left corner of the board.
     */
    absoluteToRelativePosition(pos, border = 1) {

        const bounds = this.getBounds();

        if (!bounds) return null;

        return [
            pos[0] - bounds.minX + border,
            pos[1] - bounds.minY + border
        ];
    }

    /**
     * 
     * @param {Array<Number>} pos the relative position in matrix coordinates to convert to absolute board coordinates. 
     * @param {Number} border the border size for the matrix, default is 1 (i.e., the matrix will have a border of 1 empty cell around the actual board pieces)
     * @returns {Array<Number>|null} the absolute position on the board.
     */
    relativeToAbsolutePosition(pos, border = 1) {

        const bounds = this.getBounds();

        if (!bounds) return null;

        return [
            pos[0] + bounds.minX - border,
            pos[1] + bounds.minY - border
        ];
    }

    /**
     * Returns a set of keys representing the exterior spaces of the board.
      * @param {Number} border the border size for the matrix, default is 1 (i.e., the matrix will have a border of 1 empty cell around the actual board pieces)
     * @returns {Set<String>} a set of keys representing the exterior spaces, relative to the matrix coordinates 
     */
    getExteriorSpaces() {

        const matrix = this.toMatrix(1);

        if (!matrix.length) {
            return new Set();
        }

        const height = matrix.length;
        const width = matrix[0].length;

        const exterior = new Set();
        const visited = new Set();

        const queue = [[0, 0]];

        while (queue.length) {

            const [x, y] = queue.shift();

            if (
                x < 0 ||
                y < 0 ||
                x >= width ||
                y >= height
            ) continue;

            const key = `${x},${y}`;

            if (visited.has(key)) continue;

            visited.add(key);

            // sólo atravesamos nulls
            if (matrix[y][x] !== null) continue;

            const pos = this.relativeToAbsolutePosition([x, y], 1)
            exterior.add(this.posKey(pos));

            queue.push([x + 1, y]);
            queue.push([x - 1, y]);
            queue.push([x, y + 1]);
            queue.push([x, y - 1]);
        }

        return exterior;
    }

    /**
     * Checks if a given boardPiece position is touching the exterior of the board.
     * @param {Array<Number>} position the absolute position to check. Expected format: [x, y]
     * @returns {Boolean} true if the boardPiece is touching the exterior of the board, false otherwise
     */
    isExteriorBoardPiece(position) {

        if (!this.getBoardPieceAt(position)) return false;

        const matrix = this.toMatrix(1);

        if (!matrix.length) return false;

        const exterior = this.getExteriorSpaces();

        const [mx, my] = position;

        const orthogonal = [
            [mx + 1, my],
            [mx - 1, my],
            [mx, my + 1],
            [mx, my - 1]
        ];

        return orthogonal.some(([x, y]) =>
            exterior.has(`${x},${y}`)
        );
    }

    /**
     * Returns a map of all board pieces that are touching the exterior of the board.
     * @returns {Map<String, BoardPiece>} a map of exterior board pieces
     */
    getExteriorBoardPieces() {

        const result = new Map();

        for (const [key, bp] of this._board.entries()) {

            const pos = this.keyToPos(key);

            if (this.isExteriorBoardPiece(pos)) {
                result.set(key, bp);
            }
        }

        return result;
    }

    clearHighlights() {
        for (const bp of this._board.values()) {
            bp.highlighted = false;
        }
        this._renderer.clearEmptyHighlights();
    }

    highlightEmptyCell(position) {
        const relpos = this.absoluteToRelativePosition(position, this._renderer.border);
        this._renderer.highlightEmptyCell(relpos);
    }

    /**
     * Returns board separated by connectivity.
     * @param {Boolean} Diagonal whether to consider diagonal neighbors as connected.
     * @returns {Array<Set<String>>} an array of sets, where each set contains the keys of the BoardPieces that belong to the same connected component. The keys are in the format "x,y" representing the position of the BoardPiece.
     */
    getConnectedComponents({ diagonal = false } = {}) {

        const visited = new Set();
        const components = [];

        const deltas = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ];

        if (diagonal) {
            deltas.push(
                [1, 1],
                [1, -1],
                [-1, 1],
                [-1, -1]
            );
        }

        for (const key of this._board.keys()) {

            if (visited.has(key)) {
                continue;
            }

            const component = new Set();

            const queue = [key];

            while (queue.length > 0) {

                const currentKey = queue.shift();

                if (visited.has(currentKey)) {
                    continue;
                }

                visited.add(currentKey);
                component.add(currentKey);

                const [x, y] = this.keyToPos(currentKey);

                for (const [dx, dy] of deltas) {

                    const neighborKey = this.posKey([
                        x + dx,
                        y + dy
                    ]);

                    if (
                        this._board.has(neighborKey) &&
                        !visited.has(neighborKey)
                    ) {
                        queue.push(neighborKey);
                    }
                }
            }

            components.push(component);
        }

        return components;
    }

    /**
     * @param {Boolean} diagonal whether to consider diagonal neighbors as connected
     * @returns {Boolean} true if the board is fully connected
     */
    isBoardConnected({diagonal = false} = {}) {
        return this.countConnectedComponents({ diagonal }) <= 1;
    }

    /**
     * 
     * @param {Boolean} diagonal whether to consider diagonal neighbors as connected
     * @returns {Number} the number of isolated groups of BoardPieces on the board
     */
    countConnectedComponents({diagonal = false} = {}) {
        return this.getConnectedComponents({ diagonal }).length;
    }

    /**
     * 
     * @param {Array<Number>} position 
     * @param {Boolean} diagonal whether to consider diagonal neighbors as connected 
     * @returns {Boolean} true if removing the BoardPiece at the given position would result in a disconnected board
     */
    wouldDisconnectIfRemoved(position, { diagonal = false } = {}) {

        const key = this.posKey(position);

        if (!this._board.has(key)) {
            return false;
        }

        const bp = this._board.get(key);

        // remove temporarily
        this._board.delete(key);

        const disconnected = !this.isBoardConnected({diagonal});

        // restore
        this._board.set(key, bp);

        return disconnected;
    }
}