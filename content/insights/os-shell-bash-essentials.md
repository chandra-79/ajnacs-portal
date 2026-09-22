---
title: "The Linux Shell: Bash, Navigation, and the Commands Every Engineer Uses Daily"
description: "How the shell works, bash fundamentals, essential navigation commands, keyboard shortcuts, history, and the command-line patterns that make experienced Linux engineers fast."
date: 2026-07-23
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 6
format: article
---

The shell is the primary interface between an engineer and a Linux system. Knowing it well is not optional — it determines how fast you can diagnose a production issue, automate a task, or understand an unfamiliar system. This lesson covers bash fundamentals, navigation, and the daily-use patterns that separate engineers who are fast on the command line from engineers who are slow.

## What the Shell Actually Is

When you open a terminal, you are running a **shell** — a program that reads commands you type, interprets them, and executes them. The shell is user space software, not the kernel. It communicates with the kernel via system calls like any other program.

The most common shell on Linux is **bash** (Bourne Again Shell). Modern Ubuntu and Debian systems are moving toward **dash** for non-interactive scripts (it is faster). Many engineers prefer **zsh** for interactive use. The commands in this lesson work in bash and are largely portable to zsh.

```bash
## Which shell are you running?
echo $SHELL           # your login shell
echo $0               # current shell process name

## Switch to bash explicitly
bash
```

## Navigation

```bash
## Where am I?
pwd                   # print working directory

## Move around
cd /etc               # absolute path
cd ..                 # up one level
cd ../nginx           # up then into nginx/
cd ~                  # your home directory
cd -                  # back to previous directory (toggle)
cd                    # with no argument: also goes home

## List directory contents
ls                    # basic listing
ls -l                 # long format: permissions, size, date
ls -lh                # human-readable sizes (KB, MB, GB)
ls -la                # include hidden files (starting with .)
ls -lt                # sort by modification time, newest first
ls -lS                # sort by file size, largest first

## Show directory tree (install: apt install tree)
tree /etc/nginx
tree -L 2 /var/log    # depth 2 only
```

## Creating, Copying, Moving, Deleting

```bash
## Create
mkdir mydir
mkdir -p path/to/deep/dir        # create all intermediate dirs
touch file.txt                    # create empty file or update timestamp

## Copy
cp source.txt dest.txt
cp -r sourcedir/ destdir/        # recursive (directories)
cp -a sourcedir/ destdir/        # archive: preserve permissions, timestamps

## Move / rename
mv oldname.txt newname.txt
mv file.txt /var/log/            # move to directory

## Delete
rm file.txt
rm -r directory/                 # recursive (required for directories)
rm -rf directory/                # force (no confirmation) — use carefully
rmdir emptydir/                  # remove empty directory only
```

## Viewing File Contents

```bash
cat file.txt                     # print entire file
cat -n file.txt                  # with line numbers

## For large files:
less file.txt                    # paginate; q to quit, / to search
less +G file.txt                 # open at the end (useful for logs)

head -20 file.txt                # first 20 lines
tail -20 file.txt                # last 20 lines
tail -f /var/log/syslog          # follow (live updates) — essential for logs
tail -F /var/log/nginx/access.log # follow, keep retrying if file rotated

## Show specific lines
sed -n '100,120p' file.txt       # lines 100 to 120
```

## Finding Things

```bash
## Find files by name, type, size, date
find /var/log -name "*.log"                         # by name pattern
find /home -name "*.env" -type f                    # regular files only
find /tmp -mtime +7                                 # modified more than 7 days ago
find /var -size +100M                               # larger than 100MB
find /etc -name "*.conf" -newer /etc/hosts          # newer than a reference file

## Execute a command on each result
find /tmp -name "*.tmp" -exec rm {} \;
find /var/log -name "*.log.gz" -exec ls -lh {} +    # batch exec

## Search file contents
grep "error" /var/log/syslog                        # lines containing "error"
grep -i "error" /var/log/syslog                     # case-insensitive
grep -r "api_key" /etc/                             # recursive search
grep -n "failed" auth.log                           # show line numbers
grep -v "DEBUG" app.log                             # exclude matching lines
grep -E "error|warning|critical" app.log            # extended regex (alternation)
grep -c "POST" access.log                           # count matching lines

## Faster grep for large codebases
rg "api_key" /etc/                                  # ripgrep (install separately)
```

## Keyboard Shortcuts That Change Everything

These are the shortcuts that experienced engineers use without thinking:

```
Ctrl+C          Kill the running command
Ctrl+Z          Suspend (pause) the running command; bring back with fg
Ctrl+D          Send EOF (exit current shell or Python REPL)
Ctrl+L          Clear screen (same as: clear)
Ctrl+A          Move cursor to beginning of line
Ctrl+E          Move cursor to end of line
Ctrl+K          Delete from cursor to end of line
Ctrl+U          Delete from cursor to beginning of line
Ctrl+W          Delete the word before cursor
Alt+F           Move cursor forward one word
Alt+B           Move cursor back one word
Ctrl+R          Reverse search through command history
Up/Down         Navigate command history
!!              Repeat last command
!$              Last argument of previous command
!nginx          Run most recent command starting with "nginx"
```

```bash
## History
history                          # show command history
history 30                       # last 30 commands
history | grep systemctl         # search history
!205                             # run command number 205 from history

## Make history timestamps visible
export HISTTIMEFORMAT="%Y-%m-%d %T "
history 20
```

## Redirection and Pipes: The Unix Philosophy

Commands read from standard input (stdin, file descriptor 0) and write to standard output (stdout, fd 1) and standard error (stderr, fd 2). Redirection and pipes connect these streams.

```bash
## Redirect output to file
ls -la > filelist.txt            # overwrite
ls -la >> filelist.txt           # append

## Redirect stderr
command 2> errors.txt            # stderr to file
command > output.txt 2>&1        # both stdout and stderr to same file
command > output.txt 2>/dev/null # stdout to file, discard stderr

## Pipe: output of one command becomes input of next
ps aux | grep nginx              # filter process list
cat access.log | sort | uniq -c | sort -rn | head -20   # top request counts
journalctl -u nginx | grep "error" | tail -50

## Process substitution: treat command output as a file
diff <(sort file1.txt) <(sort file2.txt)

## tee: write to stdout AND a file simultaneously
command | tee output.log         # see output and save it
command | tee -a output.log      # append to file
```

## Environment Variables

```bash
## View environment
env                              # all environment variables
printenv PATH                    # specific variable
echo $HOME                       # reference a variable

## Set variables
export MY_VAR="value"            # set in current shell and subprocesses
MY_VAR="value" command           # set for one command only, not persisted

## Persistent variables — add to ~/.bashrc or ~/.bash_profile
echo 'export MY_VAR="value"' >> ~/.bashrc
source ~/.bashrc                 # reload without opening new shell

## Important environment variables
echo $PATH                       # directories searched for executables
echo $HOME                       # your home directory
echo $USER                       # current username
echo $HOSTNAME                   # machine hostname
echo $?                          # exit code of last command (0 = success)
echo $$                          # PID of current shell
```

## The PATH: How Commands Are Found

When you type `nginx`, the shell searches each directory in `$PATH` in order, left to right, for an executable named `nginx`.

```bash
echo $PATH
## /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

## Find where a command lives
which python3                    # first match in PATH
whereis nginx                    # all locations (binary, man page, source)
type ls                          # shows whether it's an alias, function, or binary

## Add a directory to PATH (add to ~/.bashrc for persistence)
export PATH="$HOME/.local/bin:$PATH"
```

The next lesson covers the text processing tools — `grep`, `sed`, `awk`, `cut`, and `sort` — that let you extract and transform data from any text stream on the command line.
