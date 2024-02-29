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
                if (stream.sol() || state.continuation) {
                    const promptSettings = plugin.settings.terminalPrompt;
                    const promptRegex = new RegExp(promptSettings.detect);
                    const match = promptRegex.exec(stream.string);
                    if (match && stream.match(match[0])) {
                        const display = match[0].replace(promptRegex, promptSettings.display);
                        stream.pos = match[1].length; // To move the stream position to the end of the prompt
                        state.inCommand = true;
                        state.continuation = false;
                        return "meta"; // prompt
                    } else if (stream.string.trim().endsWith("\\")){
                        state.inCommand = false;
                        state.continuation = true;
                    } else {
                        state.inCommand = false;
                        state.continuation = false;
                    }
                }
                if (state.inCommand || state.continuation) {
                    const style = shellMode.token(stream, state.shellState);
                    if (stream.eol() && stream.string.trim().endsWith("\\")) {
                        state.continuation = true; // set the continuation state
                    }
                    return style;
                } else {
                    stream.skipToEnd();
                    return null; // command output
                }
            }
        };
    });
    CodeMirror.defineMIME("text/terminal", "terminal");
}