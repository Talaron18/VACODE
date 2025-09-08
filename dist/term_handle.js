"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCtrlC = handleCtrlC;
function handleCtrlC(term) {
    const selection = term.getSelection();
    if (selection.toString()) {
        navigator.clipboard.writeText(selection.toString());
    }
}
//# sourceMappingURL=term_handle.js.map