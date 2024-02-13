import { parseYaml, requestUrl } from "obsidian";

export interface Reference {
	startLine: number;
	code: string;
	language: string;
	path: string;
	external?: {
		storePath: string,
		website: string,
		info: ExternalReferenceInfo;
	}
}

export interface ReferenceParameters {
	filePath: string;
	language: string;
	start?: string | number | RegExp;
	end?: string | number | RegExp;
}

export interface ExternalReferenceInfo {
	title: string;
	url: string;
	site: string;
	datetime: string;
	rawUrl: string;
	displayUrl?: string;
	author?: string;
	repository?: string;
	path?: string;
	fileName?: string;
	refInfo?: {
		ref: string;
		type: string;
		hash: string;
	}
}

interface PassedParameters {
	filePath?: string;
	file?: string;
	path?: string;
	link?: string;
	language?: string;
	lang?: string;
	start?: string | number;
	end?: string | number;
}

export function parseReferenceParameters(source: string): ReferenceParameters {
	source = source.replace(/^([^:]+):(.+)\n/, "$1: $2\n").replace(/(?<!")\[\[(.*?)\]\](?!")/, "\"[[$1]]\"");
	let passedParameters: PassedParameters | string | null = parseYaml(source);
	if (passedParameters as string === source || passedParameters === null)
		throw Error("YAML Parse Error");
	passedParameters = passedParameters as PassedParameters;
	const filePath = passedParameters?.filePath ?? passedParameters?.file ?? passedParameters?.path ?? passedParameters?.link;
	if (filePath === undefined)
		throw Error("No file specified");
	const referenceParameters: ReferenceParameters = {filePath: filePath, language: passedParameters?.language ?? passedParameters?.lang ?? getLanguage(filePath)};
	const start = getLineIdentifier(String(passedParameters.start));
	if (start !== undefined)
		referenceParameters.start = start;
	const end = getLineIdentifier(String(passedParameters.end));
	if (end !== undefined)
		referenceParameters.end = end;
	return referenceParameters;
}

export async function parseExternalReference(reference: Reference): Promise<Partial<ExternalReferenceInfo>> {
	try {
		if (reference.external?.website === "github") {
			reference.path = (reference.path.split("?")[0]).replace(/(?<=github.com\/.*\/.*\/)raw(?=\/)/,"/blob/");
			const info = (await requestUrl({ url: reference.path, method: "GET", headers: { "Accept": "application/json", "Content-Type": "application/json" } })).json;
			return {
				title: info.payload.blob.displayName, // title: info.title,
				rawUrl: info.payload.blob.rawBlobUrl,
				displayUrl: reference.path,
				author: info.payload.repo.ownerLogin,
				repository: info.payload.repo.name,
				path: info.payload.path,
				fileName: info.payload.blob.displayName,
				refInfo: {
					ref: info.payload.refInfo.name,
					type: info.payload.refInfo.refType,
					hash: info.payload.refInfo.currentOid
				}
			};
		} else if (reference.external?.website === "gitlab")
			//TODO (@mayurankv) Update
			return {
				title: "",
				rawUrl: "",
			};
		else if (reference.external?.website === "bitbucket")
			//TODO (@mayurankv) Update
			return {
				title: "",
				rawUrl: "",
			};
		else if (reference.external?.website === "sourceforge")
			//TODO (@mayurankv) Update
			return {
				title: "",
				rawUrl: "",
			};
		else
			//TODO (@mayurankv) Update
			return {
				title: "",
			};
	} catch (error) {
		throw Error(`Could not parse external URL: ${error}`);
	}
}

function getLineIdentifier(lineIdentifier: string | undefined): RegExp | string | number | undefined {
	if (lineIdentifier === undefined)
		return undefined;
	else if (/^\/(.*)\/$/.test(lineIdentifier)) { // Regex
		try {
			return new RegExp(lineIdentifier.replace(/^\/(.*)\/$/, "$1"));
		} catch {
			throw Error("Invalid Regular Expression");
		}
	}  else if (/".*"/.test(lineIdentifier)) // Plain Text
		return lineIdentifier.substring(1,lineIdentifier.length-1);
	else if (/'.*'/.test(lineIdentifier)) // Plain Text
		return lineIdentifier.substring(1,lineIdentifier.length-1);
	else if (/\D/.test(lineIdentifier)) // Plain Text //TODO (@mayurankv) Should this be \D+ ??
		return lineIdentifier;
	else if (/\d+/.test(lineIdentifier)) // Plain Number
		return parseInt(lineIdentifier);
}

function getLanguage(filePath: string): string {
	if (filePath.startsWith("[[") && filePath.endsWith("]]"))
		filePath = filePath.slice(2, -2);
	return filePath.slice((filePath.lastIndexOf(".") - 1 >>> 0) + 2);
}
