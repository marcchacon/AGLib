class Style {

    constructor({ color, shape, size, opacity } = {}) {
        if (new.target === Style) {
            throw new Error('Style is an abstract class and cannot be instantiated directly');
        }
        this.color = color;
        this.shape = shape;
        this.size = size;
        this.opacity = opacity;
    }

    /**
     * Method to apply the style to a given HTML element. Must be implemented by subclasses.
     */
    applyTo(el) {
        throw new Error('applyTo method must be implemented by subclasses');
    }

    clone() {
        throw new Error('clone method must be implemented by subclasses');
    }
}

/**
 * PolygonStyle: Extends Style to create more complex shapes using CSS clip-path.
 * The shape parameter can specify the number of sides for a polygon
 * The _createEl method generates a div with a clip-path that creates the desired polygon shape.

 */
class PolygonStyle extends Style {
    
    /**
     * Create a polygon shape with the specified number of sides and size.
     * @param {color} color - CSS color string for the piece/space
     * @param {shape} shape - Number of sides for the polygon (3 for triangle, 4 for square, etc.). If shape is 0 or invalid, it defaults to a circle.
     * @param {size} size - Size in pixels for rendering 
     * Default values are provided for convenience.
     * @example new PolygonStyle({ color: 'blue', shape: 3, size: 32 }) // Blue triangle of size 32px
     */
    constructor({ color = 'red', sides = 1, size = 90, opacity = 1 } = {}) {
        super({color: color, shape: sides, size: size, opacity: opacity});
    }
 
    applyTo(el) {
        el.style.width = el.style.height = this.size + 'px';
        el.style.background = this.color;
        
        el.style.display = 'inline-flex';
        el.style.justifyContent = 'center';
        el.style.alignItems = 'center';

        el.style.clipPath = this._polygonPoints(this.shape, this.size);
        el.style.opacity = this.opacity;
        return true;
    }

    clone() {
        return new PolygonStyle({ color: this.color, shape: this.shape, size: this.size, opacity: this.opacity });
    }

    /**
     * Private method to generate a CSS clip-path polygon string based on the number of sides and size.
     * @param {number} sides - Number of sides for the polygon
     * @param {number} size - Size in pixels for rendering
     * @returns A CSS clip-path string that creates the desired polygon shape.
     */
    _polygonPoints(sides, size) {
        const cx = size / 2;
        const cy = size / 2;
        const r = size / 2;

        let points = [];
        if (sides < 3) {
            // Default to circle if shape is 0 or invalid
            return 'circle(50%)';
        }
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * 2 * Math.PI - Math.PI / 2;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            points.push(`${x}px ${y}px`);
        }

        return `polygon(${points.join(',')})`;
    }
}

/**
 * BasicStyle: Extends Style to create visual representations for board pieces.
 * Defaults to a simple square, but can be configured to be circles
 */
class BasicStyle extends Style {

    /**
     * 
     * @param {color} color - CSS color string for the piece/space
     * @param {shape} shape - 0 for circle, 1 for square (can be extended)
     * @param {size} size - Size in pixels for rendering 
     * @param {opacity} opacity - Opacity for the piece/space (0 to 1)
     * Default values are provided for convenience.
     * @example new BasicStyle({ color: '#bbb', shape: 1, size: 100 }) // Gray square of size 100px
     */
    constructor({ color = '#bbb', shape = 1, size = 100, opacity = 1 } = {}) {
        super({color: color, shape: shape, size: size, opacity: opacity});
    }

    applyTo(el) {
        el.style.width = el.style.height = this.size + 'px';
        el.style.background = this.color;
        el.style.borderRadius = this.shape === 0 ? '50%' : '0';
        el.style.opacity = this.opacity;

        el.style.display = 'inline-flex';
        el.style.justifyContent = 'center';
        el.style.alignItems = 'center';
        return true;
    }

    clone() {
        return new BasicStyle({ color: this.color, shape: this.shape, size: this.size, opacity: this.opacity });
    }
}