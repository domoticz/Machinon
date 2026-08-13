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
    print("OK: all strip_comments self-tests passed")

def test_strip_comments():
    # pytest entry point; the __main__ path below stays for direct runs.
    run()

if __name__ == "__main__":
    run()
