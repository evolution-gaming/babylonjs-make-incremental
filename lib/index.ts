/*
 * Converted to JS from https://github.com/BabylonJS/Babylon.js/tree/master/Tools/MakeIncremental
 */
import { join, sep } from "path";
import { readdirSync, readFileSync, writeFileSync } from "fs";

const babylonExtension = ".babylon";
const incrementalPart = ".incremental";

export interface OptionProps {
    excludedMeshes?: RegExp[];
    minMeshSize?: number;
}

interface SearchOptionsProps {
    excludedMeshes: RegExp[];
    minMeshSize: number;
}

export function makeIncremental(src: string, options: OptionProps = {}) {
    if (!src) {
        throw new Error("No source directory provided. Please pass src in the options, e.g. /scene");
    }

    const parsedSrc = fixSeparators(src);

    const parsedOptions = {
        excludedMeshes: (options.excludedMeshes || []),
        minMeshSize: options.minMeshSize || 0,
    };

    searchBabylonFiles(parsedSrc, parsedSrc, parsedOptions);
}

function searchBabylonFiles(root: string, currentPath: string, options: SearchOptionsProps) {
    const files = readdirSync(currentPath).filter((file: string) => {
        return (
            file.indexOf(incrementalPart) === -1 && // Don't process already-incremental files
            file.indexOf(babylonExtension) !== -1 &&
            file.indexOf(babylonExtension) === file.length - babylonExtension.length
        );
    });

    files.forEach((file: string) => {
        const filePath = join(currentPath, file);
        const scene = JSON.parse(readFileSync(filePath).toString());
        const filename = file.substr(0, file.lastIndexOf("."));

        scene.autoClear = true;
        scene.useDelayedTextureLoading = true;
        const doNotDelayLoadingForGeometries: string[] = [];
        const excludedMeshes = options.excludedMeshes;
        const minMeshSize = options.minMeshSize;
        // Parsing meshes
        scene.meshes.forEach((mesh: any) => {

            if (!excludedMeshes.some(meshCheck => meshCheck.test(mesh.name))) {
                const meshString = createDelayLoadingString(mesh, true);
                if  (!minMeshSize || minMeshSize < meshString.length) {
                    // Do not delay load collisions object
                    if (mesh.checkCollisions) {
                        if (mesh.geometryId) {
                            doNotDelayLoadingForGeometries.push(mesh.geometryId);
                        }
                    } else {
                        extract(mesh, currentPath, filename, meshString, true);
                    }
                } else {
                    // tslint:disable-next-line:no-console
                    console.log(
                        // tslint:disable-next-line:max-line-length
                        `Skipping ${mesh.name} as size ${meshString.length} is smaller than ${minMeshSize} from minMeshSize option`,
                    );
                }
            }
        });

        // Parsing vertexData
        const geometries = scene.geometries;
        if (geometries) {
            const vertexData = geometries.vertexData;
            vertexData.forEach((geometry: any) => {
                const id = geometry.id;

                if (!doNotDelayLoadingForGeometries.some(g => g === id)) {

                    const geometryString = createDelayLoadingString(geometry, false);
                    if (!minMeshSize || geometryString.length > minMeshSize) {
                        extract(geometry, currentPath, filename, geometryString, false);
                    } else {
                        // tslint:disable-next-line:no-console
                        console.log(
                            // tslint:disable-next-line:max-line-length
                            `Skipping ${geometry.id} as size ${geometryString.length} is smaller than ${minMeshSize} from minMeshSize option`,
                        );
                    }
                }
            });
        }

        // Saving
        const outputPath = `${filename}${incrementalPart}.babylon`;
        const json = JSON.stringify(scene, null, 0);
        writeFileSync(join(currentPath, outputPath), json);
    });
}

function extract(meshOrGeometry: any, outputDir: string, filename: string, meshString: string, mesh = true) {
    // tslint:disable-next-line:no-console
    console.log(`Extracting ${mesh ? meshOrGeometry.name : meshOrGeometry.id}`);

    if (meshOrGeometry.positions && meshOrGeometry.normals && meshOrGeometry.indices) {
        meshOrGeometry.delayLoadingFile = createDelayLoadingFile(meshOrGeometry, outputDir, filename, meshString, mesh);
        // tslint:disable-next-line:no-console
        console.log(`Delay loading file: ${meshOrGeometry.delayLoadingFile}`);

        // Compute bounding boxes
        const positions = meshOrGeometry.positions.map((v: string) => parseFloat(v));
        const minimum = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
        const maximum = [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE];

        for (let index = 0; index < positions.length; index += 3) {
            const x = positions[index];
            const y = positions[index + 1];
            const z = positions[index + 2];

            if (x < minimum[0]) {
                minimum[0] = x;
            }
            if (x > maximum[0]) {
                maximum[0] = x;
            }

            if (y < minimum[1]) {
                minimum[1] = y;
            }
            if (y > maximum[1]) {
                maximum[1] = y;
            }

            if (z < minimum[2]) {
                minimum[2] = z;
            }
            if (z > maximum[2]) {
                maximum[2] = z;
            }
        }

        meshOrGeometry.boundingBoxMinimum = minimum;
        meshOrGeometry.boundingBoxMaximum = maximum;

        // Erasing infos
        meshOrGeometry.positions = null;
        meshOrGeometry.normals = null;
        meshOrGeometry.indices = null;

        if (meshOrGeometry.uvs) {
            meshOrGeometry.hasUVs = true;
            meshOrGeometry.uvs = null;
        }

        if (meshOrGeometry.uvs2) {
            meshOrGeometry.hasUVs2 = true;
            meshOrGeometry.uvs2 = null;
        }

        if (meshOrGeometry.colors) {
            meshOrGeometry.hasColors = true;
            meshOrGeometry.colors = null;
        }

        if (meshOrGeometry.matricesIndices) {
            meshOrGeometry.hasMatricesIndices = true;
            meshOrGeometry.matricesIndices = null;
        }

        if (meshOrGeometry.matricesWeights) {
            meshOrGeometry.hasMatricesWeights = true;
            meshOrGeometry.matricesWeights = null;
        }

        if (mesh && meshOrGeometry.subMeshes) {
            meshOrGeometry.subMeshes = null;
        }
    }
}

function createDelayLoadingString(meshOrGeometry: any, mesh = true): string {
    const result: any = {
        positions: meshOrGeometry.positions,
        indices: meshOrGeometry.indices,
        normals: meshOrGeometry.normals,
    };

    if (meshOrGeometry.uvs) {
        result.uvs = meshOrGeometry.uvs;
    }

    if (meshOrGeometry.uvs2) {
        result.uvs2 = meshOrGeometry.uvs2;
    }

    if (meshOrGeometry.colors) {
        result.colors = meshOrGeometry.colors;
    }

    if (meshOrGeometry.matricesIndices) {
        result.matricesIndices = meshOrGeometry.matricesIndices;
    }

    if (meshOrGeometry.matricesWeights) {
        result.matricesWeights = meshOrGeometry.matricesWeights;
    }

    if (mesh && meshOrGeometry.subMeshes) {
        result.subMeshes = meshOrGeometry.subMeshes;
    }

    return JSON.stringify(result, null, 0);
}

function createDelayLoadingFile(
    meshOrGeometry: any,
    outputDir: string,
    filename: string,
    meshString: string,
    mesh = true,
) {
    const encodedName = (mesh ? meshOrGeometry.name : meshOrGeometry.id).replace("+", "_").replace(" ", "_");
    const outputPath = `${filename}.${encodedName}${mesh ? ".babylonmeshdata" : ".babylongeometrydata"}`;
    writeFileSync(join(outputDir, outputPath), meshString);

    return encodeURIComponent(outputPath.split(sep).pop() as string);
}

function fixSeparators(path: string): string {
    return path.replace("/", sep).replace("\\", sep);
}