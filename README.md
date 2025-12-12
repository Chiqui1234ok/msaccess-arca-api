# msaccess-arca-api

Some great text here...

## Puppeteer fix

By default, Debian doesn't have installed all the things needed for Puppeteer to run. Here're the steps to install required libraries.

1. Update apt as sudo:

```bash
apt update
```

2. As sudo, install required library:

```bash
apt-get install libglib2.0-0 libnspr4 libnss3 -y
```