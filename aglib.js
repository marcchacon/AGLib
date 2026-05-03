// AGLib.js - Minimalist Board Game Rendering Library
// Exposes: Game, Board, BoardPiece, Piece, Style
// All logic is external; this library only manages board/piece state and rendering.

/**
 * Style: Defines visual attributes for pieces and board spaces.
 * such as color, shape, and size. The toHTML method creates a simple visual representation.
 */
class Style {

    /**
     * 
     * @param {color} _color - CSS color string for the piece/space
     * @param {shape} _shape - 0 for circle, 1 for square (can be extended)
     * @param {size} _size - Size in pixels for rendering 
     * Default values are provided for convenience.
     * @example
     * new Style({ color: 'red', shape: 0, size: 32 }) // Red circle of size 32px
     */
    constructor({ color = '#aaa', shape = 1, size = 32 } = {}) {
        this._color = color;
        this._shape = shape;
        this._size = size;
    }
    /**
     * 
     * @returns a div HTML Element with it's style
     */
    toHTML() {
        const el = document.createElement('div');
        el.style.width = el.style.height = this._size + 'px';
        el.style.background = this._color;
        el.style.display = 'inline-block';
        el.style.borderRadius = this._shape === 0 ? '50%' : '0';
        return el;
    }
}
/**
 * Piece: Represents a game piece with an ID, associated player, and visual style.
 */
class Piece {

    /**
     * 
     * @param {string} id - Unique identifier for the piece
     * @param {string} player - Identifier for the owning player
     * @param {Style} style - Visual style for the piece (optional) 
     */
    constructor({ id, player, style }) {
        this.id = id;
        this.player = player;
        this.style = style || new Style();
    }
    /**
     * Function to create a new piece with the same properties, useful for copying pieces without reference issues.
     * @returns a new identical piece
     */
    clone() {
        return new Piece({ id: this.id, player: this.player, style: this.style });
    }
    /**
     * Function to create an HTML representation of the piece.
     * @returns a div HTML Element representing the piece
     */
    toHTML() {
        const el = this.style.toHTML();
        el.setAttribute('data-piece-id', this.id);
        el.setAttribute('data-player', this.player);
        return el;
    }
}

/**
 * BoardPiece: Represents a single space on the board, which may or may not contain a Piece.
 */
class BoardPiece {

    #_id;
    #_piece;
    #_style;

    /**
     * @param {string} _id - Unique identifier for the board piece
     * @param {Piece} _piece - The piece occupying the board space (optional)
     * @param {Style} _style - Visual style for the board space (optional)
     */
    constructor({ id, piece = null, style = null }) {
        this._id = id;
        this._piece = piece;
        this._style = style || new Style();
    }
    addPiece(piece) {
        if (this._piece) return false;
        this._piece = piece;
        return true;
    }
    get piece() {
        return this._piece;
    }
    setStyle(style) {
        this._style = style;
    }
    get style() {
        return this._style;
    }

    /**
     * Function to check if the board piece is empty (i.e., no piece is occupying it).
     * @returns {boolean} - True if the board piece is empty, false otherwise.
     */
    isEmpty() {
        return this.piece === null;
    }
    removePiece() {
        this.piece = null;
        return true;
    }

    toHTML() {
        const el = this.style.toHTML();
        el.setAttribute('data-boardpiece-id', this.id);
        if (this.piece) el.appendChild(this.piece.toHTML());
        return el;
    }
}

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
     * @param {Style} style default style for any auto-created BoardPieces )
     */
    constructor({x = 0, y = 0, matrix = null, style = null} = {}) {
        if (matrix) {
            this._board = new Map();
            for (let i = 0; i < matrix.length; i++) {
                for (let j = 0; j < matrix[i].length; j++) {
                    const bp = matrix[i][j];
                    if (bp instanceof BoardPiece) {
                        const pos = [j,i];
                        this._board.set(this._posKey(pos), bp);
                    } else if (bp) {
                        const pos = [j,i];
                        this._board.set(this._posKey(pos), new BoardPiece({ id: 'bp_' + this._board.size, style:  style || new Style() }));
                    }
                }
            }
        } else if (x > 0 && y > 0) {
            this._board = new Map();
            for (let i = 0; i < y; i++) {
                for (let j = 0; j < x; j++) {
                    const pos = [j, i];
                    this._board.set(this._posKey(pos), new BoardPiece({ id: 'bp_' + this._board.size, style: style || new Style() }));
                }
            }
        } else {
            this._board = new Map(); // key: position string, value: BoardPiece
        }
        this._BPstyle = style || new Style();
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
        return JSON.stringify(pos);
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
            destBp = new BoardPiece({ id: 'bp_' + this._board.size, style: new Style() });
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
     * Converts the internal board representation (a Map of position keys to BoardPieces) into a 2D array (matrix) format
     * @returns {Array<Array<BoardPiece>>} a 2D array representing the board, where each element is a BoardPiece or null.
     */
    toMatrix() {
        const entries = Array.from(this._board.entries()).map(([key, boardPiece]) => ({
            pos: JSON.parse(key),
            boardPiece
        }));

        const xs = entries.map(e => e.pos[0]);
        const ys = entries.map(e => e.pos[1]);

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const width = maxX - minX + 1;
        const height = maxY - minY + 1;

        const grid = Array.from({ length: height }, () =>
            Array.from({ length: width }, () => null)
        );

        entries.forEach(({ pos: [x, y], boardPiece }) => {
            const newX = x - minX;
            const newY = y - minY;

            grid[newY][newX] = boardPiece;
        });
        return grid;

    }

    /**
     * Creates an HTML representation of the board as a table, where each cell corresponds to a BoardPiece. 
     * @returns {HTMLTableElement | HTMLDivElement} an HTML table element representing the board, or a div with a message if the board is empty.
     */
    toHTML() {
        // Use toMatrix to get the grid and render as a table
        const grid = this.toMatrix();
        if (!grid || grid.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = '(empty board)';
            return empty;
        }
        const table = document.createElement('table');
        table.style.borderCollapse = 'collapse';
        for (const row of grid) {
            const tr = document.createElement('tr');
            for (const bp of row) {
                const td = document.createElement('td');
                td.style.padding = '0';
                if (bp) {
                    td.appendChild(bp.toHTML());
                } else {
                    td.style.background = '#ffffff';
                }
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        return table;
    }
}

/**
 * Game: Manages the overall game state, including the board, turn order, and pieces
 */
class Game {
    constructor({ board, turnOrder, pieces = [] }) {
        this.board = board;
        this.turnOrder = turnOrder;
        this.currentTurn = turnOrder[0];
        this.pieces = pieces;
    }
    nextTurn() {
        const idx = this.turnOrder.indexOf(this.currentTurn);
        this.currentTurn = this.turnOrder[(idx + 1) % this.turnOrder.length];
    }
}

// Expose globally
window.AGLib = { Game, Board, BoardPiece, Piece, Style };
