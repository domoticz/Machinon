#!/usr/bin/env python3
"""Strip comments and collapse insignificant whitespace, for comment-only diffing.

Used by scripts/check-comments-only.sh: the HEAD and working-tree versions of a
file are both run through this filter; identical output proves the change touched
only comments and whitespace.

Languages: css (/* */), js (// and /* */, aware of strings, template literals and
regex literals), html (<!-- -->). Template-literal ${} interiors are preserved
verbatim (comments inside them are not stripped); acceptable because the theme's
code is never edited by the pruning passes, only its comments.
"""
import re
import sys

_REGEX_PRECEDING_WORDS = frozenset(
    "return typeof instanceof in of new delete void case do else yield await".split()
)


def _collapse(segments):
    out = []
    for kind, text in segments:
        out.append(re.sub(r"\s+", " ", text) if kind == "code" else text)
    return "".join(out).strip()


def _consume_string(text, i, quote):
    j = i + 1
    n = len(text)
    while j < n:
        if text[j] == "\\":
            j += 2
        elif text[j] == quote:
            return j + 1
        else:
            j += 1
    return n


def strip_css(text):
    segments, i, n = [], 0, len(text)
    code = []
    while i < n:
        c = text[i]
        if c in "\"'":
            j = _consume_string(text, i, c)
            segments.append(("code", "".join(code)))
            code = []
            segments.append(("lit", text[i:j]))
            i = j
        elif text.startswith("/*", i):
            end = text.find("*/", i + 2)
            i = n if end < 0 else end + 2
            code.append(" ")
        else:
            code.append(c)
            i += 1
    segments.append(("code", "".join(code)))
    return _collapse(segments)


def _consume_template(text, i):
    j, n = i + 1, len(text)
    while j < n:
        c = text[j]
        if c == "\\":
            j += 2
        elif c == "`":
            return j + 1
        elif text.startswith("${", j):
            depth, j = 1, j + 2
            while j < n and depth:
                if text[j] == "\\":
                    j += 2
                    continue
                if text[j] in "\"'":
                    j = _consume_string(text, j, text[j])
                    continue
                if text[j] == "{":
                    depth += 1
                elif text[j] == "}":
                    depth -= 1
                j += 1
        else:
            j += 1
    return n


def _regex_can_follow(prev_char, prev_word):
    if prev_char == "" or prev_char in "([{=,;:!&|?+-*%^~<>":
        return True
    return prev_word in _REGEX_PRECEDING_WORDS


def _consume_regex(text, i):
    j, n, in_class = i + 1, len(text), False
    while j < n:
        c = text[j]
        if c == "\\":
            j += 2
            continue
        if c == "[":
            in_class = True
        elif c == "]":
            in_class = False
        elif c == "/" and not in_class:
            j += 1
            while j < n and text[j] in "dgimsuyv":
                j += 1
            return j
        elif c == "\n":
            return j  # not a regex after all; bail without swallowing the line
        j += 1
    return n


def strip_js(text):
    segments, i, n = [], 0, len(text)
    code = []
    prev_char, prev_word = "", ""
    word_open = False  # True while the current identifier/keyword is still growing

    def flush_code():
        nonlocal code
        segments.append(("code", "".join(code)))
        code = []

    def note_lit(chunk):
        # a string/template/regex literal ends any word and sets prev_char
        nonlocal prev_char, prev_word, word_open
        prev_char = chunk.rstrip()[-1]
        prev_word = ""
        word_open = False

    while i < n:
        c = text[i]
        if text.startswith("//", i):
            nl = text.find("\n", i)
            i = n if nl < 0 else nl
            code.append(" ")
            word_open = False
        elif text.startswith("/*", i):
            end = text.find("*/", i + 2)
            i = n if end < 0 else end + 2
            code.append(" ")
            word_open = False
        elif c in "\"'":
            j = _consume_string(text, i, c)
            flush_code()
            segments.append(("lit", text[i:j]))
            note_lit(text[i:j])
            i = j
        elif c == "`":
            j = _consume_template(text, i)
            flush_code()
            segments.append(("lit", text[i:j]))
            note_lit(text[i:j])
            i = j
        elif c == "/" and _regex_can_follow(prev_char, prev_word):
            j = _consume_regex(text, i)
            flush_code()
            segments.append(("lit", text[i:j]))
            note_lit(text[i:j])
            i = j
        else:
            code.append(c)
            if c.isspace():
                word_open = False
            else:
                prev_char = c
                if re.match(r"[A-Za-z0-9_$]", c):
                    prev_word = prev_word + c if word_open else c
                    word_open = True
                else:
                    prev_word = ""
                    word_open = False
            i += 1
    flush_code()
    return _collapse(segments)


def strip_html(text):
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
    return re.sub(r"\s+", " ", text).strip()


def strip(text, lang):
    return {"css": strip_css, "js": strip_js, "html": strip_html}[lang](text)


if __name__ == "__main__":
    lang = sys.argv[sys.argv.index("--lang") + 1]
    sys.stdout.write(strip(sys.stdin.read(), lang))
