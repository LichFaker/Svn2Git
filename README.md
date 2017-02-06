# Svn2Git
A command-line tool for converting a subversion repository to git

# Install
`npm install -g svn2git`

# How to use
Only support the standard svn repository(trunk，branchs，tags).

1. Create a file `users.txt`, write your svn && git username && email to the file.
2. `svn2git co users.txt http://svnchina.com/Test Test`
3. `svn2git ct`

# License
MIT
