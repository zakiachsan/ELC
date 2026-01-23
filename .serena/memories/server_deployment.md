# Server Deployment Information

## Server Details
- **Server**: srv-42287972
- **SSH Access**: `root@srv-42287972`

## Repository Location
- **Path**: `/var/www/ELC`
- **Remote**: https://github.com/zakiachsan/ELC.git
- **Branch**: main

## Auto Deployment
Server sudah setup **auto-deploy** - setiap push ke `main` branch akan otomatis deploy ke server.

## Manual Update (jika diperlukan)
```bash
# One-liner update
cd /var/www/ELC && git pull origin main

# Check current commit
cd /var/www/ELC && git log --oneline -1

# Check if behind remote
cd /var/www/ELC && git fetch && git status
```
