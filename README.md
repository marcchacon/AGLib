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

Per inicialitzar el tauler es pot fer servir el constructor de tres maneres diferents:

### Donant una mida inicial

Donant els valors x,y es crea un tauler rectangular:

```js
const board = new AGLib.Board({ x: 5, y: 5, border: 0 });
const boardHtmlElement = board.el;
```

El codi anterior retorna un div HTML que conté el tauler. El tauler té un marge de 0 caselles, de manera que no queden espais en blanc al voltant. El resultat del codi anterior es:

![board](images/5x5board.png)


### Donant una matriu de caselles

Es pot donar una matriu tant de caselles ja definides com de valors no nuls.

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

### Crear un tauler buit i afegir les caselles

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

