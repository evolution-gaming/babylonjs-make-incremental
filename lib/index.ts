/*
 * Converted to JS from https://github.com/BabylonJS/Babylon.js/tree/master/Tools/MakeIncremental
 */
import { join, sep } from "path";
import { readdirSync, readFileSync, writeFileSync } from "fs";

const babylonExtension = ".babylon";
const incrementalPart = ".incremental";

export interface OptionProps {
    excludedMeshes?: RegExp[];
}

interface SearchOptionsProps {
    excludedMeshes: RegExp[];
}

export function makeIncremental(src: string, options: OptionProps = {}) {
    if (!src) {
        throw new Error("No source directory provided. Please pass src in the options, e.g. /scene");
    }

    const parsedSrc = fixSeparators(src);

    const parsedOptions = {
        excludedMeshes: (options.excludedMeshes || []),
    };

    searchBabylonFiles(parsedSrc, parsedSrc, parsedOptions);
}

function searchBabylonFiles(root: string, currentPath: string, options: SearchOptionsProps) {
    readdirSync(currentPath).forEach((file: string) => {
        const filePath = join(currentPath, file);
        const babylonExtension = ".babylon";
        const incrementalPart = ".incremental";

        // Skip incremental files that already exist
        if (file.indexOf(incrementalPart) !== -1) {
            return;
        }

        if (file.indexOf(babylonExtension) > 0
            && file.indexOf(babylonExtension) === file.length - babylonExtension.length
        ) {
            const scene = JSON.parse(readFileSync(filePath).toString());
            const filename = file.substr(0, file.lastIndexOf("."));

            scene.autoClear = true;
            scene.useDelayedTextureLoading = true;
            const doNotDelayLoadingForGeometries: string[] = [];
            const excludedMeshes = options.excludedMeshes;
            // Parsing meshes
            scene.meshes.forEach((mesh: any) => {
                if (!excludedMeshes.some(meshCheck => meshCheck.test(mesh.name))) {
                    // Do not delay load collisions object
                    if (mesh.checkCollisions) {
                        if (mesh.geometryId) {
                            doNotDelayLoadingForGeometries.push(mesh.geometryId);
                        }
                    } else {
                        extract(mesh, currentPath, filename, true);
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
                        extract(geometry, currentPath, filename, false);
                    }
                });
            }

            // Saving
            const outputPath = `${filename}${incrementalPart}babylon`;
            const json = JSON.stringify(scene, null, 0);
            writeFileSync(join(currentPath, outputPath), json);
        }
    });
}

function extract(meshOrGeometry: any, outputDir: string, filename: string, mesh = true) {
    // tslint:disable-next-line:no-console
    console.log(`Extracting ${mesh ? meshOrGeometry.name : meshOrGeometry.id}`);

    if (meshOrGeometry.positions && meshOrGeometry.normals && meshOrGeometry.indices) {
        meshOrGeometry.delayLoadingFile = createDelayLoadingFile(meshOrGeometry, outputDir, filename, mesh);
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

function createDelayLoadingFile(meshOrGeometry: any, outputDir: string, filename: string, mesh = true) {
    const encodedName = (mesh ? meshOrGeometry.name : meshOrGeometry.id).replace("+", "_").replace(" ", "_");

    const outputPath = `${filename}.${encodedName}${mesh ? ".babylonmeshdata" : ".babylongeometrydata"}`;

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

    const json = JSON.stringify(result, null, 0);
    writeFileSync(join(outputDir, outputPath), json);

    return encodeURIComponent(outputPath.split(sep).pop() as string);
}

function fixSeparators(path: string): string {
    return path.replace("/", sep).replace("\\", sep);
}
