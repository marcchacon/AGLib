# AGLib
Repositori pel treball de fi de grau d'informàtica a la UOC

En el món dels jocs de taula abstractes existeixen poques formes de compartir els jocs creats amb la comunitat. La majoria consisteixen a compartir les normes i que els jugadors aportin els materials per poder jugar. És un mètode efectiu però analògic, sense opció a compartir una versió jugable. Existeixen eines per compartir versions jugables simples, però aquesta simplicitat les limita a no poder generar jocs amb tauler dinàmic, entre altres limitacions. Per a aquest tipus de jocs, existeixen eines per digitalitzar-los, però acostumen a ser massa genèriques i difícils d’utilitzar. En aquest treball es centrarà a dissenyar i implementar una llibreria en JavaScript per poder crear jocs de taula bidimensionals amb tauler dinàmic. Es crearan també jocs amb qualitats diferencials per poder demostrar el ventall de jocs que es poden crear amb aquesta nova eina.

Es poden provar jocs d'exemple [aqui](https://marcchacon.github.io/AGLib/)


## Funcions

Aquesta llibreria conté les funcions necessàries per crear jocs de taula bidimensionals amb tauler dinàmic. Aquestes funcions inclouen:
- Gestio completa de tauler, incloent peces
- Renderització de tauler
- Estils personalitzables per peces, caselles i tauler

## Exemple d'us

A continuació es troben diferents exemples d'us:

### Creació de tauler
Per inicialitzar el tauler es pot fer servir el constructor de tres maneres diferents:

#### Donant una mida inicial

Donant els valors x,y es crea un tauler rectangular:

```js
const board = new AGLib.Board({ x: 5, y: 5, border: 0 });
const boardHtmlElement = board.el;
```

El codi anterior retorna un div HTML que conté el tauler. El tauler té un marge de 0 caselles, de manera que no queden espais en blanc al voltant. El resultat del codi anterior es:

![board](images/5x5board.png)

#### Donant una matriu de caselles

Es pot donar una matriu tant de caselles ja definides com de valors no nuls. Igual que a l'exemple anterior, les caselles tenen un estil per defecte: `BasicStyle({ color = '#bbb', shape = 1, size = 100, opacity = 1 })`
```js
const blackBoardPieceStyle = new AGLib.BasicStyle({ color: '#000' });
const bp = new AGLib.BoardPiece({ id: 'black', style: blackBoardPieceStyle.clone() });
const matrix = [
            [1, null      , null      , null      , null      , 1],
            [1, bp.clone(), 1         , 1         , bp.clone(), 1],
            [1, bp.clone(), 1         , 1         , bp.clone(), 1],
            [1, 1         , 1         , 1         , 1         , 1],
            [1, bp.clone(), 1         , 1         , bp.clone(), 1],
            [1, bp.clone(), bp.clone(), bp.clone(), bp.clone(), 1],
            [1, 1         , 1         , 1         , 1         , 1],
        ];

const board = new AGLib.Board({matrix: matrix, border: 0 });
const boardHtmlElement = board.el;
```

Aquest codi crea un taulell de 6x7, sense marge, pero amb espais buits a la part superior. les peces que han estat definides son de color negre, mentre que les sense definir el color per defecte. El resultat es:

![board](images/matrixBoard.png)

#### Crear un tauler buit i afegir les caselles

Finalment, es pot crear un tauler buit i anar afegint les caselles que es volen. La posició de les caselles es absoluta, mentre que el que el tauler que apareix en pantalla es relatiu. Crear una casella en la posició [-1,-1] la deixara centrada en el tauler si es la unica casella que existeix. Això es pot veure en el codi:

```js
const board = new AGLib.Board();

const redBoardPieceStyle = new AGLib.BasicStyle({ color: '#f00' });
const bp = new AGLib.BoardPiece({ id: 'red', style: redBoardPieceStyle.clone() });

board.addBoardPiece(bp, [-1, -1]);

const boardHtmlElement = board.el;
```
![board](images/1x1redBoard.png)

Si després s'afegeix una altre casella, es mourà tot el tauler:
```js
const greenBoardPieceStyle = new AGLib.BasicStyle({ color: '#0f0' });
const bp_green = new AGLib.BoardPiece({ id: 'red', style: greenBoardPieceStyle.clone() });

board.addBoardPiece(bp, [1, 2]);
```

El tauler queda:

![board](images/greenRedBoard.png)

### Modificació del tauler

Per moure caselles es pot fer servir `board.moveBoardPiece(oldPos, newPos)`, on `oldPos` es la posició absoluta de la casella que es vol moure, i `newPos` es la posició absoluta on es vol posar la casella. Per exemple, per moure la casella de l'exemple anterior al centre de coordenades s'ha de fer:
```js
board.moveBoardPiece([-1, -1], [0, 0]);
```
Encara que visualment estigui a `[0,0]`. 

![board](images/redGreenBoard2.png)

També es pot resaltar una casella:
```js
const board = new AGLib.Board({ x: 5, y: 5 });

//Agafem la casella de la part superior esquerra
const bp = board.getBoardPieceAt([0,0])

bp.highlighted = true;
```

El tauler queda:

![board](images/highlightedBoardPiece.png)

L'estil de resaltat es pot personalitzar modificant `bp.highlightedStyle`. Per netajar el resaltat es pot fer `bp.highlighted = false;`. Es poden netejar tots els resaltats amb `board.clearHighlights()`.

Es pot modificar l'estil base modificant `bp.style`.

Per ultim, es pot eliminar una casella amb `board.removeBoardPiece(pos)`.

### Gestió de peces

El funcionament de les peces es similar al de les caselles. Un cop definit el tauler, es poden afegir les peces. Les peces fan servir les mateixes classes que les caselles pel disseny:

```js
const board = new AGLib.Board({ x: 5, y: 5 });

//Formes basiques:
const redSquareStyle = new AGLib.BasicStyle({color: "red", size: 80});
const greenCircleStyle = new AGLib.BasicStyle({color: "green", size: 90, shape: 0});

//Formes complexes:
const blueTriangleStyle = new AGLib.PolygonStyle({color: "blue", size: 100, sides: 3});
const yellowHexagonStyle = new AGLib.PolygonStyle({color: "yellow", sides: 6});

board.addPiece(new AGLib.Piece({style: redSquareStyle}), [0, 0]);
board.addPiece(new AGLib.Piece({style: greenCircleStyle}), [1, 1]);
board.addPiece(new AGLib.Piece({style: blueTriangleStyle}), [2, 2]);
board.addPiece(new AGLib.Piece({style: yellowHexagonStyle}), [3, 3]);
```

Les peces es veuen de la seguent manera:

![board](images/multiplePieceShape.png)

Per moure les peces es fa servir `board.movePiece(oldPos, newPos, createBP)`, on oldPos i newPos actuen igual que a moveBoardPiece, pero es pot triar si en cas que newPos sigui un espai buit, es crei automaticament una casella. En cas que sigui fals i newPos sigui un espai buit, retorna false, indicant que el moviment no s'ha pogut dur a terme.

Per eliminar una peça, es fa servir `board.removePiece(pos)`. Alternativament, si es te l'objecte de la BoardPiece on esta la peça, es pot cridar directament mitjançant `bp.removePiece()`.


### Gestió d'events.

TODO