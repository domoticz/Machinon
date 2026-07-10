Machinon issue and contributing Guidelines
==========================================

### Issue Guidelines

Before opening a new issue, please review the following:
* The Github Issues is for Domoticz CODE Bugs only. Please do not use this for general questions, howto, or this is not working conversations. If you have a question, please post to our forum at https://www.domoticz.com/forum/viewtopic.php?f=8&t=24084
* Please use the search feature to see if your issues have been raised or addressed first.
* First try to update to the latest beta version.
* Always state your version when reporting code related issues
* Often we will require Log Files and Screenshots to help diagnose the issue. 

### Contributing to Machinon

Please base your bug fixes against the beta branch. The master branch is considered the stable and is used for our releases. 
All changes should be based against the beta branch, unless advised by a Maintainer to use a different branch.

### Writing comments in the theme

Machinon styles a UI it does not own. Many of its rules exist because of something in
Domoticz core rather than because of a preference, and that reason is invisible in the
code. An unexplained rule looks arbitrary, gets simplified away, and the bug it prevented
comes back. Comments exist to stop that.

Write a comment only when the code cannot say it. Restating a rule in prose is noise.
Three kinds are worth writing:

* An invariant that other rules depend on. Mark it `CONTRACT:` so it reads as something
  you may not break.
* A "do not do X, because Y" note wherever the obvious simplification is wrong. This is
  the most valuable kind: it records a trap, so the next person does not fall into it.
* A pointer to the code that forces our hand, named by file and line. When a rule exists
  because of Domoticz core, cite core.

Record measurements, not intentions. A stated pixel value or a measured constraint can be
checked and stays honest; a description of what a rule was meant to achieve cannot.

Use Domoticz's own vocabulary for Domoticz's features, and never refer to internal project
phases, task numbers or milestones. They mean nothing to a reader and outlive the work
they name.

Comments rot like code. When you change a rule, reread its comment in the same edit.

When a fix is constrained rather than chosen, say what would have to change to lift the
constraint and what that would cost. Such notes accumulate into a map of where the theme
is tangled and what untangling each knot would take.

The same applies to JavaScript comments.
