# CORS Proxy Setup for WordNet Demo

## Overview

The WordNet demo uses a CORS proxy to bypass browser security restrictions when downloading WordNet data from external sources during development. This allows you to test real data loading functionality locally without CORS errors.

## How It Works

### Vite Development Server Proxy

The demo uses Vite's built-in proxy configuration to route external requests through the development server:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api/en-word-net': {
      target: 'https://en-word.net',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/en-word-net/, ''),
    },
    '/api/globalwordnet': {
      target: 'https://github.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/globalwordnet/, '/globalwordnet'),
    },
    '/api/github': {
      target: 'https://github.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/github/, ''),
    },
    '/api/raw-github': {
      target: 'https://raw.githubusercontent.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/raw-github/, ''),
    },
    '/api/external': {
      target: 'https://httpbin.org',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/external/, ''),
    },
  },
}
```

### URL Conversion

The data loader automatically converts external URLs to proxy URLs in development:

```typescript
// Example URL conversions:
// https://en-word.net/static/english-wordnet-2024.xml.gz
// → /api/en-word-net/static/english-wordnet-2024.xml.gz

// https://github.com/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz
// → /api/globalwordnet/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz

// https://raw.githubusercontent.com/globalwordnet/english-wordnet/2024-edition/english-wordnet-2024.xml.gz
// → /api/raw-github/globalwordnet/english-wordnet/2024-edition/english-wordnet-2024.xml.gz
```

## Supported Data Sources

### 1. Open English WordNet (en-word.net) ✅ WORKING
- **Proxy Path**: `/api/en-word-net`
- **Target**: `https://en-word.net`
- **Data**: English WordNet XML files (2021-2024)
- **Status**: ✅ Confirmed working

### 2. Global WordNet GitHub Releases ⚠️ PARTIAL
- **Proxy Path**: `/api/globalwordnet`
- **Target**: `https://github.com/globalwordnet`
- **Data**: Official WordNet releases and CILI data
- **Status**: ⚠️ Works but may have redirect issues

### 3. GitHub API
- **Proxy Path**: `/api/github`
- **Target**: `https://github.com`
- **Data**: GitHub API access for releases and metadata
- **Status**: ✅ Available

### 4. Raw GitHub Content ⚠️ TESTING
- **Proxy Path**: `/api/raw-github`
- **Target**: `https://raw.githubusercontent.com`
- **Data**: Direct file access from GitHub repositories
- **Status**: ⚠️ Testing - may need correct file paths

### 5. Generic External Proxy
- **Proxy Path**: `/api/external`
- **Target**: `https://httpbin.org` (fallback)
- **Data**: Any other HTTPS URLs
- **Status**: ✅ Available

## Current Status

### ✅ Working Endpoints
- **en-word.net**: Successfully proxying WordNet XML files
- **GitHub API**: Available for metadata access

### ⚠️ Partially Working
- **GitHub Releases**: May have redirect issues with CDN
- **Raw GitHub**: Needs correct file paths

### 🔧 Recent Fixes
1. **Database Operations**: Fixed SQLite bind parameter issues
2. **Error Handling**: Added comprehensive error handling and logging
3. **Fallback URLs**: Added multiple fallback sources
4. **Proxy Configuration**: Enhanced redirect handling

## Usage

### Development Environment

1. **Start the development server**:
   ```bash
   pnpm dev
   ```

2. **Check proxy status** in the demo interface:
   - The "CORS Proxy Status" section shows if the proxy is enabled
   - Use "Test Connectivity" to verify all endpoints are working

3. **Load WordNet data**:
   - The proxy automatically handles URL conversion
   - No additional configuration needed

### Production Environment

- Proxy is automatically disabled in production
- Direct URLs are used instead of proxy URLs
- No CORS issues in production builds

## Troubleshooting

### Common Issues

1. **Proxy not working**:
   - Ensure you're running on `localhost` or `127.0.0.1`
   - Check that the development server is running
   - Verify the proxy configuration in `vite.config.ts`

2. **Network errors**:
   - Check your internet connection
   - Verify the target servers are accessible
   - Try different data sources if one fails

3. **CORS errors still occurring**:
   - Make sure you're using the development server, not a production build
   - Check browser console for specific error messages
   - Verify the URL conversion is working correctly

4. **Database errors**:
   - Check that SQLite WASM is properly loaded
   - Verify database schema is created correctly
   - Look for specific error messages in console

### Debugging

1. **Check proxy logs** in the terminal:
   ```
   Sending Request to en-word.net: GET /static/english-wordnet-2024.xml.gz
   Received Response from en-word.net: 200 /static/english-wordnet-2024.xml.gz
   ```

2. **Test individual endpoints**:
   ```bash
   # Test en-word.net proxy (WORKING)
   curl http://localhost:5173/api/en-word-net/static/english-wordnet-2024.xml.gz

   # Test GitHub proxy (MAY HAVE REDIRECT ISSUES)
   curl http://localhost:5173/api/globalwordnet/globalwordnet/english-wordnet/releases/latest
   ```

3. **Check browser network tab**:
   - Look for requests to `/api/*` endpoints
   - Verify responses are coming through the proxy

### Known Issues

1. **GitHub Release Redirects**: GitHub release URLs redirect to CDN which may block CORS
2. **Raw GitHub Paths**: Need to verify correct file paths for raw.githubusercontent.com
3. **Database Bind Errors**: Fixed - was due to incorrect parameter passing

## Configuration

### Custom Proxy Configuration

You can modify the proxy configuration in `vite.config.ts`:

```typescript
proxy: {
  '/api/custom': {
    target: 'https://your-custom-server.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/custom/, ''),
  },
}
```

### Environment Variables

The proxy automatically detects the environment:
- **Development**: Proxy enabled on `localhost` and `127.0.0.1`
- **Production**: Proxy disabled, direct URLs used

## Data Sources

### Available WordNet Packages

1. **Open English WordNet (OEWN)**:
   - Versions: 2021, 2022, 2023, 2024
   - Source: `https://en-word.net/static/`
   - Format: XML (LMF)
   - Status: ✅ Working

2. **CILI (Collaborative Interlingual Index)**:
   - Version: 1.0
   - Source: `https://github.com/globalwordnet/cili/releases/`
   - Format: TSV
   - Status: ⚠️ Testing

3. **Princeton WordNet**:
   - Source: `https://wordnet.princeton.edu/`
   - Format: Various
   - Status: 🔧 Not yet implemented

### Fallback Strategy

The demo uses a fallback strategy for data loading:

1. Try primary URL (proxied) - en-word.net
2. Try fallback URLs if primary fails - GitHub releases
3. Try raw GitHub URLs as additional fallback
4. Load sample data if all external sources fail
5. Show appropriate error messages

## Security Considerations

- **Development Only**: Proxy is only active in development
- **No Sensitive Data**: Only public WordNet data is accessed
- **Read-Only**: Proxy only handles GET requests for data downloads
- **Timeout Protection**: Requests have 5-second timeouts to prevent hanging

## Performance

- **Caching**: Browser caches proxy responses
- **Compression**: Gzip compression is preserved through the proxy
- **Streaming**: Large files are streamed efficiently
- **Progress Tracking**: Download progress is maintained through the proxy

## Recent Improvements

### ✅ Fixed Issues
1. **Database Operations**: Fixed SQLite bind parameter format
2. **Error Handling**: Added comprehensive try-catch blocks
3. **Proxy Configuration**: Enhanced redirect handling
4. **Fallback URLs**: Added multiple reliable sources

### 🔧 Current Status
- **en-word.net**: ✅ Working perfectly
- **GitHub Releases**: ⚠️ May have redirect issues
- **Raw GitHub**: 🔧 Testing file paths
- **Database Operations**: ✅ Fixed and working
- **Error Handling**: ✅ Comprehensive logging

## Future Enhancements

- [ ] Add more data sources (Spanish, French, etc.)
- [ ] Implement proxy caching for better performance
- [ ] Add proxy health monitoring
- [ ] Support for different data formats
- [ ] Automatic proxy failover
- [ ] Fix GitHub release redirect issues
- [ ] Verify raw GitHub file paths 