import CodeStylerPlugin from "src/main";

export function addTerminalSyntaxHighlight(CodeMirror: typeof window.CodeMirror, plugin: CodeStylerPlugin): void {
    console.log("Adding terminal syntax highlight");
    CodeMirror.defineMode("terminal", function(config, _parserConfig) {
        var shellMode = CodeMirror.getMode(config, "shell");
        return {
            startState: function() {
                return {
                    inCommand: false,
                    continuation: false,
                    shellState: CodeMirror.startState(shellMode),
                };
            },
            token: function(stream, state) {
                if (stream.sol()) {
                    const promptSettings = plugin.settings.terminalPrompt;
                    let promptRegex = new RegExp(promptSettings.detect);
                    let match = stream.match(promptRegex, false) // Pattern must start with ^ for CodeMirror to treat it as a regex
                    if (match) {
                        stream.pos += match[0].length; // To move the stream position to the end of the prompt
                        state.inCommand = true;
                        state.continuation = stream.string.trim().endsWith("\\");
                        return "meta"; // prompt
                    } else {
                        state.inCommand = false;
                    }
                }
                if (state.inCommand || state.continuation) {
                    const style = shellMode.token(stream, state.shellState);
                    if (stream.eol() && !stream.string.trim().endsWith("\\")) {
                        state.continuation = false;
                    }
                    return style; // tokens from shellMode
                } else {
                    state.inCommand = false;
                    state.continuation = false;
                    stream.skipToEnd();
                    return null; // command output
                }
            }
        };
    });
    CodeMirror.defineMIME("text/terminal", "terminal");
}