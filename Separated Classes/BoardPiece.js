class BoardPiece {

    /**
     * @param {string} id
     * @param {Piece} piece
     * @param {BasicStyle} style
     * @param {boolean} clickable
     * @param {boolean} droppable
     * @param {boolean} draggable
     */
    constructor({
        id,
        piece = null,
        style,
        highlightedStyle,
        dragOverStyle,
        clickable = true,
        droppable = true,
        draggable = false
    } = {}) {

        this.id = id;

        this.piece = null;

        this._highlighted = false;

        this.cloned = 0;

        this._renderer = new BoardPieceRenderer(this, {
            piece,
            style,
            highlightedStyle,
            dragOverStyle,
            clickable,
            droppable,
            draggable
        });

        if (piece) {
            this.addPiece(piece);
        }
    }

    // --- RENDERING API ---

    get el() {
        return this._renderer.el;
    }

    refresh() {
        this._renderer.refresh();
    }

    set style(v) {
        this._renderer.style = v;
        this.refresh();
    }

    get style() {
        return this._renderer.style;
    }

    set highlightedStyle(v) {
        this._renderer.highlightedStyle = v;
        this.refresh();
    }

    get highlightedStyle() {
        return this._renderer.highlightedStyle;
    }

    set dragOverStyle(v) {
        this._renderer.dragOverStyle = v;
        this.refresh();
    }

    get dragOverStyle() {
        return this._renderer.dragOverStyle;
    }

    set clickable(v) {
        this._renderer.clickable = v;
    }

    get clickable() {
        return this._renderer.clickable;
    }

    set droppable(v) {
        this._renderer.droppable = v;
    }

    get droppable() {
        return this._renderer.droppable;
    }

    set draggable(v) {
        this._renderer.draggable = v;
    }

    get draggable() {
        return this._renderer.draggable;
    }

    set highlighted(v) {
        this._highlighted = v;
        this.refresh();
    }

    get highlighted() {
        return this._highlighted;
    }

    // --- PIECE LOGIC ---

    addPiece(piece) {

        if (this.piece) return false;

        this.piece = piece;

        piece._setBoardPiece(this);

        this.refresh();

        return true;
    }

    removePiece() {

        if (!this.piece) return false;

        this.piece._setBoardPiece(null);

        this.piece = null;

        this.refresh();

        return true;
    }

    isEmpty() {
        return this.piece === null;
    }

    // --- AUX ---

    /**
     * Clones a board piece and returns a new instance.
     * The piece property is not cloned and will be set to null in the new instance.
     * @returns {BoardPiece} A new instance of BoardPiece with the same properties as the original.
     */
    clone() {

        this.cloned++;

        return new BoardPiece({
            id: `${this.id}_clone_${this.cloned}`,
            style: this.style?.clone?.(),
            highlightedStyle: this.highlightedStyle?.clone?.(),
            dragOverStyle: this.dragOverStyle?.clone?.(),
            clickable: this.clickable,
            droppable: this.droppable,
            draggable: this.draggable
        });
    }
}

class BlankSpace extends BoardPiece {
    constructor({ id, style, highlightedStyle, dragOverStyle, clickable, droppable, draggable } = {}) {
        super({
            id,
            piece: null,
            style,
            highlightedStyle,
            dragOverStyle,
            clickable,
            droppable,
            draggable
        });
    }
}