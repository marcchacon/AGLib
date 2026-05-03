// AGLib.js - Minimalist Board Game Rendering Library
// Exposes: Game, Board, BoardPiece, Piece, Style
// All logic is external; this library only manages board/piece state and rendering.

/**
 * Style: Defines visual attributes for pieces and board spaces.
 * such as color, shape, and size. The toHTML method creates a simple visual representation.
 */
class Style {

    _color;
    _shape;
    _size;

    /**
     * 
     * @param {color} color - CSS color string for the piece/space
     * @param {shape} shape - 0 for circle, 1 for square (can be extended)
     * @param {size} size - Size in pixels for rendering 
     * Default values are provided for convenience.
     * @example
     * new Style({ color: 'red', shape: 0, size: 32 }) // Red circle of size 32px
     */
    constructor({ color = '#aaa', shape = 0, size = 32 } = {}) {
        this._color = color;
        this._shape = shape;
        this._size = size;
    }
    toHTML() {
        const el = document.createElement('div');
        el.style.width = el.style.height = this._size + 'px';
        el.style.background = this._color;
        el.style.display = 'inline-block';
        el.style.borderRadius = this._shape === 0 ? '50%' : '0';
        return el;
    }
}

class Piece {

    #id;
    #player;
    #style;

    constructor({ id, player, style }) {
        this.id = id;
        this.player = player;
        this.style = style || new Style();
    }
    clone() {
        return new Piece({ id: this.id, player: this.player, style: this.style });
    }
    toHTML() {
        const el = this.style.toHTML();
        el.setAttribute('data-piece-id', this.id);
        el.setAttribute('data-player', this.player);
        return el;
    }
}

class BoardPiece {

    #id;
    #piece;
    #style;

    constructor({ id, piece = null, style = null }) {
        this.id = id;
        this.piece = piece;
        this.style = style || new Style();
    }
    isEmpty() {
        return this.piece === null;
    }
    removePiece() {
        this.piece = null;
        return true;
    }
    setPiece(piece) {
        if (this.piece) return false;
        this.piece = piece;
        return true;
    }
    getPiece() {
        return this.piece;
    }
    toHTML() {
        const el = this.style.toHTML();
        el.setAttribute('data-boardpiece-id', this.id);
        if (this.piece) el.appendChild(this.piece.toHTML());
        return el;
    }
}

class Board {

    constructor() {
        this.board = new Map(); // key: position string, value: BoardPiece
    }
    _posKey(pos) {
        return JSON.stringify(pos);
    }
    addBoardPiece(boardPiece, position) {
        const key = this._posKey(position);
        if (this.board.has(key)) return false;
        this.board.set(key, boardPiece);
        return true;
    }
    moveBoardPiece(oldPos, newPos) {
        const oldKey = this._posKey(oldPos);
        const newKey = this._posKey(newPos);
        if (!this.board.has(oldKey) || this.board.has(newKey)) return false;
        const bp = this.board.get(oldKey);
        this.board.delete(oldKey);
        this.board.set(newKey, bp);
        return true;
    }
    removeBoardPiece(position) {
        const key = this._posKey(position);
        return this.board.delete(key);
    }
    piecesPlaced() {
        return Array.from(this.board.values()).map(bp => !bp.isEmpty()).filter(Boolean);
    }
    addPiece(piece, position) {
        const key = this._posKey(position);
        let bp = this.board.get(key);
        if (!bp || bp.piece) return false;
        bp.setPiece(piece);
        return true;
    }

    movePiece(oldPos, newPos) {
        const oldKey = this._posKey(oldPos);
        const newKey = this._posKey(newPos);
        const bp = this.board.get(oldKey);
        if (!bp || !bp.getPiece() || this.board.has(newKey)) return false;
        const piece = bp.getPiece();
        bp.removePiece();
        let newBp = this.board.get(newKey);
        if (!newBp) {
            newBp = new BoardPiece({ id: 'bp_' + newKey, style: new Style() });
            this.board.set(newKey, newBp);
        }
        newBp.piece = piece;
        return true;
    }
    getPieceAt(position) {
        const key = this._posKey(position);
        const bp = this.board.get(key);
        return bp ? bp.piece : null;
    }
    getNeighbors(position) {
        // Minimal: returns adjacent positions (orthogonal)
        const [x, y] = position;
        const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const neighbors = new Map();
        for (const [dx, dy] of deltas) {
            const pos = [x + dx, y + dy];
            const key = this._posKey(pos);
            if (this.board.has(key)) neighbors.set(key, this.board.get(key));
        }
        return neighbors;
    }
    toMatrix() {
        const entries = Array.from(this.board.entries()).map(([key, boardPiece]) => ({
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
    // Setters/getters can be added as needed
}

// Expose globally
window.AGLib = { Game, Board, BoardPiece, Piece, Style };
