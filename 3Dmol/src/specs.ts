import { ColorschemeSpec, ColorSpec } from './colors';
import { GLModel } from './glmodel';
import { GLViewer } from './glviewer';
// Specifications for various object types used in 3Dmol.js
// This is primarily for documentation

/**
 * Grid GLViewer input specification
 * @typedef ViewerGridSpec
 * @prop {number} rows - number of rows in grid
 * @prop {number} cols - number of columns in grid
 * @prop {boolean} control_all - if true, mouse events are linked
 */
export type ViewerGridSpec = {
  rows: number;
  cols: number;
  /** if `true`, mouse events are linked */
  control_all: boolean;
}

/**
 * Atom representation. Depending on the input file format, not all fields may be defined.
 */
export type AtomSpec = {
  /** @prop {string} resn - Parent residue name */
  resn: string;
  /** @prop {number} x - Atom's x coordinate */
  x: number;
  /** @prop {number} y - Atom's y coordinate */
  y: number;
  /** @prop {number} z - Atom's z coordinate */
  z: number;
  /** @prop {ColorSpec} color - Atom's color, as hex code or built-in color string */
  color: ColorSpec;
  /** @prop {ColorSpec} surfaceColor - Hex code for color to be used for surface patch over this atom */
  surfaceColor: ColorSpec;
  /** @prop {string} elem - Element abbreviation (e.g. 'H', 'Ca', etc) */
  elem: string;
  /** @prop {boolean} hetflag - Set to true if atom is a heteroatom */
  hetflag: boolean;
  /** @prop {string} chain - Chain this atom belongs to, if specified in input file (e.g 'A' for chain A) */
  chain: string;
  /** @prop {number} resi - Residue number */
  resi: number;
  /** @prop {number} icode */
  icode: number;
  /** @prop {number} rescode */
  rescode: number;
  /** @prop {number} serial - Atom's serial id number */
  serial: number;
  /** @prop {string} atom - Atom name; may be more specific than 'elem' (e.g 'CA' for alpha carbon) */
  atom: string;
  /** @prop {Array.<number>} bonds - Array of atom ids this atom is bonded to */
  bonds: Array<number>;
  /** @prop {string} ss - Secondary structure identifier (for cartoon render; e.g. 'h' for helix) */
  ss: string;
  /** @prop {boolean} singleBonds - true if this atom forms only single bonds or no bonds at all */
  singleBonds: boolean;
  /** @prop {Array.<number>} bondOrder - Array of this atom's bond orders, corresponding to bonds identfied by 'bonds' */
  bondOrder: Array<number>;
  /** @prop {Object} properties - Optional mapping of additional properties */
  properties: Object;
  /** @prop {number} b - Atom b factor data */
  b: number;
  /** @prop {string} pdbline - If applicable, this atom's record entry from the input PDB file (used to output new PDB from models) */
  pdbline: string;
  /** @prop {boolean} clickable - Set this flag to true to enable click selection handling for this atom */
  clickable: boolean;
  /** @prop {function(this, $3Dmol.GLViewer)} callback - Callback click handler function to be executed on this atom and its parent viewer */
  callback: (this: AtomSpec, viewer: GLViewer) => void;
  /** @prop {boolean} invert - for selection, inverts the meaning of the selection */
  invert: boolean;
}

/** GLViewer input specification */
export type ViewerSpec = {
  /** Callback function to be immediately executed on this viewer */
  callback: (viewer: GLViewer) => void;
  /** Object defining default atom colors as atom => color property value pairs for all models within this viewer */
  defaultColors: Record<string | number, string>,
  /** Whether to disable disable handling of mouse events. 
   * If you want to use your own mouse handlers, set this then bind your handlers to the canvas object.  
   * The default 3Dmol.js handlers are available for use: 
   - `mousedown touchstart`: viewer._handleMouseDown, 
   - `DOMMouseScroll mousewheel`: viewer._handleMouseScroll
   - `mousemove touchmove`: viewer._handleMouseMove */
  nomouse: boolean,
  /** Color of the canvas background */
  backgroundColor: string,
  /** Alpha transparency of canvas background */
  backgroundAlpha: number,
  camerax: number,
  hoverDuration: number,
  id: string,
  /** default 5 */
  cartoonQuality: number,
  row: number,
  col: number,
  rows: number,
  cols: number,
  canvas: HTMLCanvasElement,
  viewers: GLViewer[],
  minimumZoomToDistance: number,
  lowerZoomLimit: number,
  upperZoomLimit: number,
  antialias: boolean,
  control_all: boolean
  orthographic: boolean,
  /** default false */
  disableFog: boolean
}
/**
 * Atom selection object. Used to specify what atoms should be selected.  Can include
 * any field from {@link AtomSpec} in which case atoms must equal the specified value.
 * All fields must match for the selection to hold. If values
 * are provided as a list, then only one value of the list must match.
 * @example
 * $3Dmol.download("pdb:2EJ0",viewer,{},function(){
                  viewer.setStyle({chain:'B'},{cartoon:{color:'spectrum'}});
                  viewer.setStyle({chain:'B',invert:true},{cartoon:{}});
                  viewer.setStyle({bonds: 0},{sphere:{radius:0.5}}); //water molecules
                  viewer.setStyle({resn:'PMP',byres:true,expand:5},{stick:{colorscheme:"greenCarbon"}});
                  viewer.setStyle({resi:["91-95","42-50"]},{cartoon:{color:"green",thickness:1.0}});
                  viewer.render();


                });
 */
export type AtomSelectionSpec = AtomSpec & {
  /** model - a single model or list of models from which atoms should be selected.  Can also specify by numerical creation order.  Reverse indexing is allowed (-1 specifies last added model). */
  model: GLModel;
  /** bonds - overloaded to select number of bonds, e.g. {bonds: 0} will select all nonbonded atoms */
  bonds: number;
  /** predicate - user supplied function that gets passed an {AtomSpec} and should return true if the atom should be selected */
  predicate: (atom: AtomSpec) => boolean;
  /** invert - if set, inverts the meaning of the selection */
  invert: boolean;
  /** byres - if set, expands the selection to include all atoms of any residue that has any atom selected */
  byres: boolean;
  /** expand - expands the selection to include all atoms within a given distance from the selection */
  expand: number;
  /** within - intersects the selection with the set of atoms within a given distance from another selection */
  within: WithinSelectionSpec;
  /** and - take the intersection of the provided lists of {AtomSelectionSpec}s */
  and: AtomSelectionSpec[];
  /** or - take the union of the provided lists of {AtomSelectionSpec}s */
  or: AtomSelectionSpec[];
  /** not - take the inverse of the provided {AtomSelectionSpec} */
  not: AtomSelectionSpec;
}

export type Vector3 = { x: number, y: number, z: number };

/**
  * Within selection object. Used to find the subset of an atom selection that is within
  * some distance from another atom selection. When added as a field of an {@link AtomSelectionSpec},
  * intersects the set of atoms in that selection with the set of atoms within a given
  * distance from the given {@link AtomSelectionSpec}.
  * @example $3Dmol.download("pdb:2EJ0",viewer,{},function(){
                   viewer.setStyle({chain: 'A', within:{distance: 10, sel:{chain: 'B'}}}, {sphere:{}});
                   viewer.render();
                 });// stylizes atoms in chain A that are within 10 angstroms of an atom in chain B
*/
export type WithinSelectionSpec = {
  /**  distance - the distance in angstroms away from the atom selection to include atoms in the parent selection */
  distance: number;
  /** invert - if set, selects atoms not within distance range for intersection */
  invert: boolean;
  /** sel - the selection of atoms against which to measure the distance from the parent atom selection */
  sel: AtomSelectionSpec;
}

// @todo: STUB TYPES
export type LineStyleSpec = any;
export type CrossStyleSpec = any;
export type CartoonStyleSpec = any;
export type StickStyleSpec = any;
export type SphereStyleSpec = any;
export type ClickSphereStyleSpec = any;
export type VolumeData = any;

export type AtomStyleSpec = {
  /** line - draw bonds as lines */
  line: LineStyleSpec,
  /** cross - draw atoms as crossed lines (aka stars) */
  cross: CrossStyleSpec,
  /** stick  - draw bonds as capped cylinders */
  stick: StickStyleSpec,
  /** sphere - draw atoms as spheres */
  sphere: SphereStyleSpec,
  /** cartoon - draw cartoon representation of secondary structure */
  cartoon: CartoonStyleSpec,
  /** clicksphere - invisible style for click handling only */
  clicksphere: ClickSphereStyleSpec
}

/**
 * Surface style specification.
 * @example
 * var setStyles = function(volumedata){
                    var data = new $3Dmol.VolumeData(volumedata, "cube");
                    viewer.addSurface("VDW", {opacity:0.85, voldata: data, volscheme: new $3Dmol.Gradient.RWB(-10,10)},{chain:'A'});
                    viewer.mapAtomProperties($3Dmol.applyPartialCharges);
                    viewer.addSurface($3Dmol.SurfaceType.SAS, {map:{prop:'partialCharge',scheme:new $3Dmol.Gradient.RWB(-.05,.05)}, opacity:1.0},{chain:'B'});
                    viewer.addSurface($3Dmol.SurfaceType.VDW, {opacity:0.85,voldata: data, color:'red'},{chain:'C'});
                    viewer.addSurface($3Dmol.SurfaceType.SAS, {opacity:0.85,voldata: data, colorscheme:'greenCarbon'},{chain:'D'}); 
              viewer.render();
              };
              $3Dmol.download("pdb:4DLN",viewer,{},function(){ 
                  $.get("data/1fas.cube",setStyles);
                }); 
 */
export type SurfaceStyleSpec = {
  /** opacity - sets the transparency: 0 to hide, 1 for fully opaque */
  opacity: number,
  /** colorscheme - element based coloring */
  colorscheme: ColorschemeSpec,
  /** color - fixed coloring, overrides colorscheme */
  color: ColorSpec,
  /** voldata - volumetric data for vertex coloring, can be VolumeData object or raw data if volformat is specified */
  voldata: VolumeData,
  /** volscheme - coloring scheme for mapping volumetric data to vertex color, if not a Gradient object, show describe a builtin gradient one by providing an object with gradient, min, max, and (optionally) mid fields. */
  volscheme: Gradient,
  /** volformat - format of voldata if not a $3Dmol.VolumeData object */
  volformat: string,
  /** map - specifies a numeric atom property (prop) and color mapping (scheme) such as {@link $3Dmol.Gradient.RWB}.  Deprecated, use colorscheme instead. */
  map: Record<string, ColorschemeSpec>
}

/**
* Isosurface style specification
*/
export type IsoSurfaceSpec = {
  /**  isoval - specifies the isovalue to draw surface at */
  isoval: number
  /**  voxel - if true uses voxel style rendering */
  voxel: boolean
  /**  color - solid color */
  color: ColorSpec
  /**  opacity - transparency, between 0 and 1 */
  opacity: number
  /**  wireframe - draw as wireframe, not surface */
  wireframe: boolean
  /**  linewidth - width of line for wireframe rendering **No longer supported by most browsers** */
  linewidth: number
  /**  smoothness - amount to smooth surface (default 1) */
  smoothness: number
  /**  coords - coordinates around which to include data; use viewer.selectedAtoms() to convert an AtomSelectionSpec to coordinates */
  coords: Array<any>
  /**  seldist - distance around coords to include data [default = 2.0] */
  seldist: number
  /**  voldata - volumetric data for vertex coloring, can be VolumeData object or raw data if volformat is specified */
  voldata: VolumeData
  /**  volscheme - coloring scheme for mapping volumetric data to vertex color, if not a Gradient object, show describe a builtin gradient one by providing an object with gradient, min, max, and (optionally) mid fields. */
  volscheme: Gradient
  /**  volformat - format of voldata if not a $3Dmol.VolumeData object  */
  volformat: string
  /**  clickable - if true, user can click on object to trigger callback */
  clickable: boolean
  /**  callback - function to call on click */
  callback: Function

}

/**
  * VolumetricRenderer style specification
  * @todo implement pruning of data, should start with box 
  */
export type VolumetricRendererSpec = {
  /** transferfn - list of objects containing @color, @opacity and @value properties to specify color per voxel data value */
  transferfn: Array<{ color: ColorSpec, opacity: number, value: number }>,
  /** subsamples - number of times to sample each voxel approximately (default 5) */
  subsamples: number;
  /** coords - coordinates around which to include data; use viewer.selectedAtoms() to convert an AtomSelectionSpec to coordinates */
  coords: Array<any>,
  /** seldist - distance around coords to include data [default = 2.0] */
  seldist: number,
}

/**
   * GLShape style specification
   */
export type ShapeSpec = {
  /** color - solid color */
  color: ColorSpec,
  /** alpha - transparency */
  alpha: number,
  /** wireframe - draw as wireframe, not surface */
  wireframe: boolean,
  /** hidden - if true, do not display object */
  hidden: boolean,
  /** linewidth - width of line for wireframe rendering **No longer supported by most browsers** */
  linewidth: number,
  /** clickable - if true, user can click on object to trigger callback */
  clickable: boolean,
  /** callback - function to call on click */
  callback: Function,
  /** frame - if set, only display in this frame of an animation */
  frame: number
}

/**
  * Specification for adding custom shape. Extends {@link ShapeSpec}.
  */
export type CustomShapeSpec = ShapeSpec & {
  /** vertexArr - List of vertex positions */
  vertexArr: Vector3;
  /** normalArr - List of normal vectors for each vertex */
  normalArr: Vector3;
  /** faceArr - List of triangles to build the custom shape. Each triangle is defined by the indices of 3 vertices in vertexArr, so the array length should be 3 times the number of faces. */
  faceArr: number;
  /** color - Either a single color for the whole object or an array specifying the color at each vertex. */
  color: ColorSpec | Array<ColorSpec>;
}

/**
   * Sphere shape specification. Extends {@link ShapeSpec}
   */
export type SphereShapeSpec = ShapeSpec & {
  center: Vector3,
  radius: number
}

/**
   * Box shape specification. Extends {@link ShapeSpec}
   */
export type BoxSpec = ShapeSpec & {
  corner: Vector3,
  center: Vector3,
  dimensions: { w: number, h: number, d: number }
}

/**
 * Arrow shape specification.  Extends {@link ShapeSpec}
 */
export type ArrowSpec = ShapeSpec & {
  start: Vector3,
  end: Vector3,
  radius: number,
  color: ColorSpec,
  hidden: boolean,
  /** radiusRatio - ratio of arrow base to cylinder (1.618034 default) */
  radiusRatio: number,
  /** mid - relative position of arrow base (0.618034 default) */
  mid: number,
  /** midpos - position of arrow base in length units, if negative positioned from end instead of start.  Overrides mid. */
  midpos: number
}

/**
 * Cylinder shape specification.  Extends {@link ShapeSpec}
 */
export type CylinderSpec = ShapeSpec & {
  start: Vector3,
  end: Vector3,
  radius: number,
  /** fromCap - 0 for none, 1 for flat, 2 for round */
  fromCap: CAP,
  /** toCap - 0 for none, 1 for flat, 2 for round */
  toCap: CAP,
  dashed: boolean
}


/**
 * Curve shape specification.  Extends {@link ShapeSpec}
 */
export type CurveSpec = ShapeSpec & {
  /** points - list of (x,y,z) points to interpolate between to make curve */
  points: Array<Vector3>,
  /** smooth - amount of interpolation */
  smooth: number,
  radius: number,
  /** fromArrow - if an arrow should be drawn at the start */
  fromArrow: boolean,
  /** toArrow - if an arrow should be drawn at the end */
  toArrow: boolean
}


/**
 * Line shape specification.  Extends {@link ShapeSpec}  (but defaults to wireframe)
 */
export type LineSpec = ShapeSpec & {
  start: Vector3,
  end: Vector3
}

/**
* File formats supported by 3Dmol.js
* - `cdjson,json`  Chemical JSON format
* - `cube` Gaussian cube format
* - `gro`  Gromacs topology format, need to add coordinates to resulting model.
* - `mcif,cif` Crystallographic Information File, the successor to PDB that makes you miss the PDB file format
* - `mmtf` Macromolecular Transmission Format, the successor to PDB that is totally awesome
* - `mol2` Sybyl Mol2 format
* - `pdb` The venerable Protein Data Bank format
* - `pqr` Like PDB but with partial charges which are read into the partialcharge atom property
* - `prmtop` Amber topology file, must add coordinates
* - `sdf` MDL MOL format, supports multiple models and meta data
* - `vasp` VASP format (CONTCAR, POSCAR)
* - `xyz` XYZ cartesian coordinates format
*/
export type FileFormats =
  'cdjson'
  | 'json'
  | 'cube'
  | 'gro'
  | 'mcif'
  | 'cif'
  | 'mmtf'
  | 'mol2'
  | 'pdb'
  | 'pqr'
  | 'prmtop'
  | 'sdf'
  | 'vasp'
  | 'xyz'
