class Piece {

    /**
     * 
     * @param {string} id - Unique identifier for the piece
     * @param {string} player - Player to which the piece belongs
     * @param {PolygonStyle} style - Style of the piece
     * @param {boolean} clickable - Whether the piece is clickable
     * @example new Piece({id: 'piece1', player: 'Player1', style: new PolygonStyle({ fillColor: 'red' }), clickable: true});
     */
    constructor({id, player, style, clickable = true} = {}) {

        this.id = id;
        this.player = player;

        this.boardPiece = null;
        this.cloned = 0;

        this._renderer = new PieceRenderer(this, {
            style,
            clickable
        });
    }

    // --- RENDERING API ---

    /**
     * Returns the DOM element representing the piece. If the element does not exist, it will be created.
     */
    get el() {
        return this._renderer.el;
    }

    /**
     * Refreshes the piece's appearance by calling the renderer's refresh method. This should be called whenever the piece's properties that affect its appearance are changed.
     */
    refresh() {
        this._renderer.refresh();
    }

    /**
     * Sets the style of the piece.
     * @param {Style} style - The new style for the piece
     */
    set style(style) {
        this._renderer.style = style;
        this.refresh();
    }

    /**
     * Returns the style of the piece.
     * @returns {Style} The style of the piece
     */
    get style() {
        return this._renderer.style;
    }

    /**
     * Sets whether the piece is clickable.
     * @param {boolean} value - Whether the piece should be clickable
     */
    set clickable(value) {
        this._renderer.clickable = value;
    }

    /**
     * Returns whether the piece is clickable.
     * @returns {boolean} Whether the piece is clickable
     */
    get clickable() {
        return this._renderer.clickable;
    }

    set draggable(value) {
        this._renderer.draggable = value;
    }

    get draggable() {
        return this._renderer.draggable;
    }

    // --- AUXILARY METHODS ---

    /**
     * Creates a clone of the piece.
     * @returns {Piece} A new instance of the piece with the same properties
     */
    clone() {

        this.cloned++;

        return new Piece({
            id: `${this.id}_clone_${this.cloned}`,
            player: this.player,
            style: this.style.clone(),
            clickable: this.clickable
        });
    }

    /**
     * Sets the board piece associated with this piece. The BoardPice must have its piece property set to this piece for the association to be valid.
     * @param {BoardPiece} boardPiece - The board piece to associate with this piece
     * @returns {boolean} Whether the board piece was successfully set
     */
    _setBoardPiece(boardPiece) {

        if (boardPiece === null) {
            this.boardPiece = null;
            return true;
        }

        if (boardPiece instanceof BoardPiece && boardPiece.piece === this) {
            this.boardPiece = boardPiece;
            return true;
        }

        return false;
    }
}