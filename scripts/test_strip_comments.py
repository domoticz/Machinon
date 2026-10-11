#!/usr/bin/env python3
"""Self-tests for strip_comments.py. Run: python3 scripts/test_strip_comments.py"""
from strip_comments import strip

def eq(lang, src, expected):
    got = strip(src, lang)
    assert got == expected, f"{lang}: {got!r} != {expected!r}"

def run():
    # CSS: comment goes, string containing /* survives
    eq("css", "a{color:red;/* note */}", "a{color:red; }")
    eq("css", 'a::before{content:"/*x*/";}', 'a::before{content:"/*x*/";}')
    eq("css", "a{ }\n\n\n/* gone */\nb{ }", "a{ } b{ }")
    # JS: line and block comments go; strings, templates, regexes survive intact
    eq("js", "var a = 1; // note\nvar b = 2;", "var a = 1; var b = 2;")
    eq("js", "var a = 1; /* note */ var b = 2;", "var a = 1; var b = 2;")
    eq("js", 'var u = "http://x/*y*/";', 'var u = "http://x/*y*/";')
    eq("js", "var r = /a\\/\\/b/g;", "var r = /a\\/\\/b/g;")
    eq("js", "var d = a / b / c;", "var d = a / b / c;")
    eq("js", "var t = `a ${x // not a comment in output? it IS code\n} b`;",
             "var t = `a ${x // not a comment in output? it IS code\n} b`;")
    eq("js", "return /x/.test(s); // tail", "return /x/.test(s);")
    # regex after a keyword, with // inside a character class: the word tracker
    # must see "return" so this parses as a regex, not division then a comment
    eq("js", "return /[//]/.test(s);", "return /[//]/.test(s);")
    # HTML: comment goes, whitespace collapses
    eq("html", "<div>\n<!-- gone -->\n<span>x</span></div>", "<div> <span>x</span></div>")
    # js-ship: what the release build ships. Comments go, but every line break
    # that separates code stays, because automatic semicolon insertion reads
    # them: collapsing "return\n1" into "return 1" changes what the code does.
    eq("js-ship", "function f() {\n    return\n    1;\n}", "function f() {\nreturn\n1;\n}")
    eq("js-ship", "var a = 1 // note\nvar b = 2", "var a = 1\nvar b = 2")
    # a block comment holding a line break IS a line terminator for ASI
    eq("js-ship", "var a = 1 /* one\ntwo */ var b = 2", "var a = 1\nvar b = 2")
    eq("js-ship", "var a = 1; /* note */ var b = 2;", "var a = 1; var b = 2;")
    # literals are never touched, multi-line template indentation included
    eq("js-ship", "var t = `a\n    b // kept`;\n", "var t = `a\n    b // kept`;")
    eq("js-ship", 'var u = "http://x/*y*/";  // tail', 'var u = "http://x/*y*/";')
    eq("js-ship", "return /[//]/.test(s);\n\n\n\nx();", "return /[//]/.test(s);\nx();")
    print("OK: all strip_comments self-tests passed")

def test_strip_comments():
    # pytest entry point; the __main__ path below stays for direct runs.
    run()

if __name__ == "__main__":
    run()
