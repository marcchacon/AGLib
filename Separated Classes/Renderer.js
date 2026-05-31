/**
 * Abstract base class for renderers. This class should not be instantiated directly, 
 * but should be extended by specific renderer implementations for different models.
 */
class Renderer {

    constructor(model) {

        if (new.target === Renderer) {
            throw new Error('Renderer is abstract');
        }

        this.model = model;
        this._el = null;
    }

    get el() {
        if (!this._el) this._createEl();
        return this._el;
    }

    refresh() {
        throw new Error('refresh() must be implemented');
    }

    _createEl() {
        throw new Error('_createEl() must be implemented');
    }

    destroy() {
        if (!this._el) return;
        this._el.remove();
        this._el = null;
    }
}

/**
 * Renderer for the Piece class. 
 * This class is responsible for creating and updating the DOM element that represents a piece on the board. 
 * It also handles user interactions with the piece, such as clicks and drags, and emits custom events.
 */
class PieceRenderer extends Renderer {

    /**
     * Creates a new PieceRenderer instance.
     * @param {Piece} piece - The piece model to render
     * @param {Object} options - Rendering options 
     * @param {Style} options.style The style to apply to the piece
     * @param {boolean} options.clickable - Whether the piece is clickable (default: true)
     * @param {boolean} options.draggable - Whether the piece is draggable (default: true)
     * @example new PieceRenderer(piece, { style: new PolygonStyle({ color: 'red' }), clickable: true });
     */
    constructor(piece, {
        style = new PolygonStyle(),
        clickable = true,
        draggable = true
    } = {}) {

        super(piece);

        this.style = style;
        this._clickable = clickable;
        this._draggable = draggable;

        this._onClick = this._emitClick.bind(this);
        this._onDragStart = this._emitDragStart.bind(this);
        this._onDragEnd = this._emitDragEnd.bind(this);
    }

    _createEl() {

        this._el = document.createElement('div');

        this._el.setAttribute('data-piece-id', this.model.id);
        this._el.setAttribute('data-player', this.model.player);
        this._el.setAttribute('data-piece', this.model);

        this.clickable = this._clickable;
        this.draggable = this._draggable;

        this.refresh();

        return this._el;
    }

    refresh() {

        if (!this._el) return;

        this._el.style = '';

        this.style.applyTo(this._el);
    }

    // --- SYNC EVENTS ---

    set clickable(value) {
        this._clickable = value;

        if (!this._el) return;

        this._el.removeEventListener('click', this._onClick);
        this._el.style.cursor = 'default';

        if (this.clickable) {
            this._el.addEventListener('click', this._onClick);
            this._el.style.cursor = 'grab';
        } else if (this.draggable) {
            this._el.style.cursor = 'grab';
        }
    }

    get clickable() {
        return this._clickable;
    }

    set draggable(value) {
        this._draggable = value;

        if (!this._el) return;

        this._el.removeEventListener('dragstart', this._onDragStart);
        this._el.removeEventListener('dragend', this._onDragEnd);
        this._el.draggable = false;
        this._el.style.cursor = 'default';

        if (this.draggable) {
            this._el.addEventListener('dragstart', this._onDragStart);
            this._el.addEventListener('dragend', this._onDragEnd);
            this._el.draggable = true;
            this._el.style.cursor = 'grab';
        } else if (this.clickable) {
            this._el.style.cursor = 'grab';
        }
    }

    get draggable() {
        return this._draggable;
    }

    /**
     * Private method to emit a piececlick event when the piece is clicked.
     * @private
     * @param {MouseEvent} event - The click event
     */
    _emitClick(e) {
        e.currentTarget.dispatchEvent(
            new CustomEvent('piececlick', {
                detail: {
                    piece: this.model,
                    timestamp: Date.now()
                },
                bubbles: true
            })
        );
    }

    /**
     * Private method to emit a piecedragstart event when drag starts.
     * @private
     * @param {DragEvent} event - The dragstart event
     */
    _emitDragStart(e) {
        e.currentTarget.dispatchEvent(
            new CustomEvent('piecedragstart', {
                detail: {
                    piece: this.model,
                    timestamp: Date.now()
                },
                cancelable: true,
                bubbles: true
            })
        );

        e.dataTransfer.setData(
            'text/plain',
            JSON.stringify({
                piece: this.model
            })
        );
    }

    /**
     * Private method to emit a piecedragend event when drag ends.
     * @private
     * @param {DragEvent} event - The dragend event
     */
    _emitDragEnd(e) {
        e.currentTarget.dispatchEvent(
            new CustomEvent('piecedragend', {
                detail: {
                    piece: this.model,
                    cancelled: e.dataTransfer.dropEffect === 'none',
                    timestamp: Date.now()
                },
                bubbles: true
            })
        );
    }
}

class BoardPieceRenderer extends Renderer {

    constructor(boardPiece, {
        piece,
        style = new BasicStyle(),
        highlightedStyle,
        dragOverStyle,
        clickable = true,
        droppable = true,
        draggable = false
    } = {}) {

        super(boardPiece);

        this.style = style;
        this.dragOverStyle = dragOverStyle || new BasicStyle({ color: this.style.color, shape: this.style._shape, size: this.style._size, opacity: 0.7 });
        this.highlightedStyle = highlightedStyle || new BasicStyle({ color: '#ada', shape: this.style._shape, size: this.style._size, opacity: 1 });
        this._clickable = clickable;
        this._droppable = droppable;
        this._draggable = draggable;

        this._onClick = this._emitClick.bind(this);
        this._onDragOver = this._onDragOver.bind(this);
        this._onDragLeave = this._onDragLeave.bind(this);
        this._onDrop = this._emitDrop.bind(this);
        this._onDragStart = this._onDragStart.bind(this);
        this._onDragEnd = this._onDragEnd.bind(this);
    }

    // --- DOM ---

    _createEl() {

        this._el = document.createElement('div');

        this._el.setAttribute('data-boardpiece-id', this.model.id);
        this._el.setAttribute('data-boardpiece', this.model);

        this.clickable = this._clickable;
        this.droppable = this._droppable;
        this.draggable = this._draggable;

        this.refresh();

        return this._el;
    }

    refresh() {

        if (!this._el) return;

        const bp = this.model;

       this._el.style = '';

        // STYLE SELECTION
        if (this.model.highlighted) {
            this.highlightedStyle.applyTo(this._el);
        } else {
            this.style.applyTo(this._el);
        }

        // CHILD RENDERING
        this._replaceChild();
    }

    _replaceChild() {

        if (!this._el) return;

        const currentChild = this._el.firstElementChild;
        const desiredChild = this.model.piece?.el || null;

        if (currentChild === desiredChild) {
            return;
        }

        if (currentChild && currentChild !== desiredChild) {
            currentChild.remove();
        }

        if (desiredChild && desiredChild.parentNode !== this._el) {
            this._el.appendChild(desiredChild);
        }

    }

    // --- SYNC EVENTS ---

    set clickable(value) {
        this._clickable = value;

        if (!this._el) return;

        this._el.style.cursor = 'default';
        this._el.removeEventListener('click', this._onClick);
        if (this.clickable) {
            this._el.addEventListener('click', this._onClick);
            this._el.style.cursor = 'grab';
        } else if (this.draggable) {
            this._el.style.cursor = 'grab';
        }
    }

    get clickable() {
        return this._clickable;
    }

    set droppable(value) {
        this._droppable = value;

        if (!this._el) return;

        this._el.removeEventListener('dragover', this._onDragOver);
        this._el.removeEventListener('dragleave', this._onDragLeave);
        this._el.removeEventListener('drop', this._onDrop);
        if (this.droppable) {
            this._el.addEventListener('dragover', this._onDragOver);
            this._el.addEventListener('dragleave', this._onDragLeave);
            this._el.addEventListener('drop', this._onDrop);
        }
    }

    get droppable() {
        return this._droppable;
    }

    set draggable(value) {
        this._draggable = value;

        if (!this._el) return;

        this._el.removeEventListener('dragstart', this._onDragStart);
        this._el.removeEventListener('dragend', this._onDragEnd);

        this._el.style.cursor = 'default';
        this._el.draggable = false;

        if (this.draggable) {
            this._el.draggable = true;
            this._el.addEventListener('dragstart', this._onDragStart);
            this._el.addEventListener('dragend', this._onDragEnd);
        } else if (this.clickable) {
            this._el.style.cursor = 'grab';
        }
    }

    get draggable() {
        return this._draggable;
    }

    // --- EVENTS ---

    _emitClick(e) {

        e.currentTarget.dispatchEvent(
            new CustomEvent('boardpiececlick', {
                detail: {
                    boardPiece: this.model,
                    timestamp: Date.now()
                },
                bubbles: true
            })
        );
    }

    _onDragOver(e) {

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        this.dragOverStyle.applyTo(this._el);
    }

    _onDragLeave() {
        this.refresh();
    }

    _emitDrop(e) {

        e.preventDefault();

        e.currentTarget.dispatchEvent(
            new CustomEvent('boardpiecedrop', {
                detail: {
                    boardPiece: this.model,
                    sourceData: e.dataTransfer.getData('text/plain'),
                    timestamp: Date.now()
                },
                bubbles: true
            })
        );

        this.refresh();
    }

    _onDragStart(e) {

        e.currentTarget.dispatchEvent(
            new CustomEvent('boardpiecedragstart', {
                detail: {
                    boardPiece: this.model,
                    timestamp: Date.now()
                },
                cancelable: true,
                bubbles: true
            })
        );

        e.dataTransfer.setData(
            'text/plain',
            JSON.stringify({
                boardPiece: this.model
            })
        );
    }

    _onDragEnd() {
        this.refresh();
    }
}

class BoardRenderer extends Renderer {


    /**
     * 
     * @param {Board} board the board to render
     * @param {Object} StyleParameters basic parameters to render the board
     * @param {number} StyleParameters.gap gap between cells in pixels (default: 6)
     * @param {string} StyleParameters.background background color of the board (default: 'white')
     * @param {Style} StyleParameters.cellStyle default style for empty cells (default: BasicStyle with transparent color)
     */
    constructor(board, {
        border = 1,
        gap = 6,
        background = 'white',
        cellStyle,
        highlightedCellStyle,
    } = {}) {

        super(board);

        this._border = border;
        this.gap = gap;
        this.background = background;

        if (!(cellStyle instanceof Style)) {
            //throw new Error('cellStyle must be a Style instance (BasicStyle, PolygonStyle, etc.)');
            this.cellStyle = new BasicStyle({ color: 'transparent', size: 100 })
        } else {
            this.cellStyle = cellStyle;
        }

        if (!(highlightedCellStyle instanceof Style)) {
            //throw new Error('highlightedCellStyle must be a Style instance (BasicStyle, PolygonStyle, etc.)');
            this.highlightedCellStyle = new BasicStyle({ color: 'lightgreen', size: 100 });
        } else {
            this.highlightedCellStyle = highlightedCellStyle;
         }

        this._cells = [];
    }

    set border(value) {
        this._border = value;
        this.refresh();
    }

    get border() {
        return this._border;
    }

    clearEmptyHighlights() {
        for (const row of this._cells) {
            for (const cell of row) {
                if (cell.dataset.highlighted === 'true') {
                    cell.dataset.highlighted = 'false';
                    this.cellStyle.applyTo(cell);
                }
            }
         }
    }

    highlightEmptyCell(position) {
        const cell = this._cells[position[1]][position[0]];
        cell.dataset.highlighted = 'true';
        this.highlightedCellStyle.applyTo(cell);
    }

    get el() {
        if (!this._el) this._createEl();
        return this._el;
    }

    _createEl() {

        this._el = document.createElement('div');

        this._el.style.background = this.background;

        this._el.style.position = 'relative';
        this._el.style.display = 'grid';
        this._el.style.userSelect = 'none';
        this._el.style.touchAction = 'none';
        this._el.style.gap = `${this.gap}px`;

        this.refresh();

        return this._el;
    }

    refresh() {

        if (!this._el) this._createEl();

        const matrix = this.model.toMatrix(this._border);
        if (!matrix || matrix.length === 0) {
            this._el.innerHTML = '';
            this._cells = [];
            return;
        }

        // compute absolute bounds of the board so we can map matrix indices to absolute positions
        const keys = Array.from(this.model.board.keys());
        let minX = Infinity, minY = Infinity;
        for (const k of keys) {
            const [kx, ky] = k.split(',').map(Number);
            if (kx < minX) minX = kx;
            if (ky < minY) minY = ky;
        }
        this._minX = minX === Infinity ? 0 : minX;
        this._minY = minY === Infinity ? 0 : minY;

        const rows = matrix.length;
        const cols = matrix[0].length;
        const cellSize = this._computeCellSize(matrix);

        this._el.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        this._el.style.gridAutoRows = `${cellSize}px`;

        this._ensureCells(rows, cols, cellSize);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = this._cells[y][x];
                cell.style.width = `${cellSize}px`;
                cell.style.height = `${cellSize}px`;
                // map matrix indices to absolute board coordinates
                const absX = x + this._minX - this._border;
                const absY = y + this._minY - this._border;
                cell.dataset.posAbs = `${absX},${absY}`;
                const boardPiece = matrix[y][x];
                this._syncCell(cell, boardPiece);
            }
        }
    }

    _ensureCells(rows, cols, cellSize) {
        const desiredCount = rows * cols;
        const currentCount = this._el.children.length;

        if (currentCount < desiredCount) {
            for (let i = currentCount; i < desiredCount; i++) {
                this._el.appendChild(this._createCell(cellSize));
            }
        } else if (currentCount > desiredCount) {
            for (let i = currentCount - 1; i >= desiredCount; i--) {
                this._el.removeChild(this._el.children[i]);
            }
        }

        this._cells = [];
        let index = 0;
        for (let y = 0; y < rows; y++) {
            this._cells[y] = [];
            for (let x = 0; x < cols; x++) {
                const cell = this._el.children[index++];
                this._cells[y][x] = cell;
            }
        }
    }

    _createCell(cellSize) {
        const cell = document.createElement('div');
        cell.style.boxSizing = 'border-box';
        cell.style.width = `${cellSize}px`;
        cell.style.height = `${cellSize}px`;

        this.cellStyle.applyTo(cell);

        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';

        cell._handlers = {
            click: (ev) => {
                this._handleCellClick(cell, ev);
            },
            drop: (ev) => {
                ev.preventDefault();
                this._handleCellDrop(cell, ev);
            },
            dragover: (ev) => {
                ev.preventDefault();
                this._handleCellDragover(cell, ev);
            }
        };

        this._enableCellEvents(cell);

        return cell;
    }

    _computeCellSize(matrix) {
        let maxSize = -Infinity;

        for (const row of matrix) {
            for (const boardPiece of row) {
                if (!boardPiece) continue;

                const bpSize = boardPiece.style?.size;
                if (typeof bpSize === 'number') {
                    maxSize = Math.max(maxSize, bpSize);
                }

                const pieceSize = boardPiece.piece?.style?.size;
                if (typeof pieceSize === 'number') {
                    maxSize = Math.max(maxSize, pieceSize);
                }
            }
        }

        return maxSize;
    }

    _syncCell(cell, boardPiece) {

        const hasPiece = !!boardPiece?.el;

        const currentChild = cell.firstElementChild;

        if (hasPiece) {

            if (currentChild !== boardPiece.el) {

                if (currentChild) {
                    cell.removeChild(currentChild);
                }

                cell.appendChild(boardPiece.el);
            }

            this._disableCellEvents(cell);
            return;
        }

        // empty cell
        if (currentChild) {
            cell.removeChild(currentChild);
        }

        this._enableCellEvents(cell);
    }

    _enableCellEvents(cell) {
        if (cell._eventsEnabled) return;

        cell.addEventListener('click', cell._handlers.click);
        cell.addEventListener('drop', cell._handlers.drop);
        cell.addEventListener('dragover', cell._handlers.dragover);

        cell._eventsEnabled = true;
    }

    _disableCellEvents(cell) {
        if (!cell._eventsEnabled) return;

        cell.removeEventListener('click', cell._handlers.click);
        cell.removeEventListener('drop', cell._handlers.drop);
        cell.removeEventListener('dragover', cell._handlers.dragover);

        cell._eventsEnabled = false;
    }

    _handleCellClick(cell, e) {
        e.currentTarget.dispatchEvent(
            new CustomEvent('emptyspaceclick', {
                detail: {
                    cell: cell,
                    pos: cell.dataset.posAbs.split(',').map(Number),
                    highlighted: cell.dataset.highlighted === 'true',
                    timestamp: Date.now()
                },
                bubbles: true
            })
        );
    }

    _handleCellDrop(cell, e) {
        e.currentTarget.dispatchEvent(
            new CustomEvent('emptyspacedrop', {
                detail: {
                    cell: cell,
                    pos: cell.dataset.posAbs.split(',').map(Number),
                    sourceData: e.dataTransfer.getData('text/plain'),
                    timestamp: Date.now()
                },
                bubbles: true
            })
        );
    }

    _handleCellDragover(cell, e) {
        return; // no need to emit an event for dragover, just allow dropping
    }
}