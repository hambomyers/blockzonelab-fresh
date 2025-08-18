# Cloudflare Pages Deployment Guide for BlockZone Lab

## **Current Configuration Status**

✅ **CSS Loading**: Fixed by importing CSS directly in main.js  
✅ **Asset Paths**: Configured proper base URL and asset handling  
✅ **Environment Variables**: Configured in vite.config.js for client-side access  
✅ **Build Configuration**: Optimized for production deployment  
✅ **Static Assets**: Properly configured public directory handling  

## **Cloudflare Pages Settings**

### **Build Settings**
- **Framework preset**: None (Custom)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave empty)

### **Environment Variables**
Your Vite config automatically handles these, but you can override them in Cloudflare Pages:

#### **Required Variables (Client-side accessible)**
```
VITE_API_BASE_URL=https://api.blockzonelab.com
VITE_SONIC_LABS_API_URL=https://api.soniclabs.xyz
VITE_BLOCKCHAIN_NETWORK=sonic-testnet
VITE_LEADERBOARD_SCOPE=global
VITE_KV_NAMESPACE=LEADERBOARD_KV
```

#### **Optional Variables (Client-side accessible)**
```
VITE_ENABLE_DEV_MODE=false
VITE_ENABLE_PERFORMANCE_LOGGING=true
VITE_SONIC_LABS_API_KEY=your_api_key_here
VITE_ENABLE_REGIONAL_LEADERBOARDS=false
VITE_DEFAULT_REGION=global
VITE_TEST_MODE=false
VITE_PAYMENTS_ENABLED=true
VITE_PAYOUTS_ENABLED=true
```

#### **Server-side Only Variables (No VITE_ prefix)**
```
NODE_ENV=production
PRIVATE_KEY=your_private_key_here
```

### **Build Environment**
- **Node.js version**: 14.x or higher (as specified in package.json)
- **NPM version**: 6.x or higher

## **Deployment Steps**

### **1. Local Testing**
```bash
# Build the project
npm run build

# Test the build locally
npm run preview

# Verify the build output
ls -la dist/
```

### **2. Git Deployment**
```bash
# Commit your changes
git add .
git commit -m "Update deployment configuration"
git push origin main
```

### **3. Cloudflare Pages Setup**
1. Go to Cloudflare Dashboard → Pages
2. Connect your GitHub repository
3. Configure build settings as above
4. Add environment variables (optional - Vite config handles defaults)
5. Deploy

## **Available Build Scripts**

Your package.json includes these useful scripts:

```bash
# Standard build
npm run build

# Production optimized build
npm run build:optimized

# Build with analysis
npm run build:analyze

# Preview production build
npm run preview

# Test API connectivity
npm run test-api

# Performance measurement
npm run measure-performance
```

## **Verification Checklist**

### **Before Deployment**
- [ ] `npm run build` completes successfully
- [ ] `npm run preview` shows correct content
- [ ] CSS styles are applied correctly
- [ ] JavaScript functionality works
- [ ] All assets load without 404 errors

### **After Deployment**
- [ ] Production site matches local preview
- [ ] No console errors in browser
- [ ] All static assets load correctly
- [ ] Environment variables are accessible
- [ ] Performance is acceptable

## **Troubleshooting**

### **Common Issues**

#### **1. CSS Not Loading**
- **Cause**: CSS not imported in JavaScript
- **Fix**: Ensure CSS is imported in main.js (already fixed)

#### **2. Environment Variables Not Working**
- **Cause**: Variables not properly configured in vite.config.js
- **Fix**: Check vite.config.js define section (already configured)

#### **3. Asset 404 Errors**
- **Cause**: Incorrect base URL or asset paths
- **Fix**: Verify base: '/' in vite.config.js (already set)

#### **4. Build Failures**
- **Cause**: Missing dependencies or configuration
- **Fix**: Check package.json and vite.config.js

### **Debug Commands**
```bash
# Check build output
npm run build && ls -la dist/

# Test production build locally
npm run preview

# Check for environment variable issues
npm run build:analyze

# Test API connectivity
npm run test-api

# Measure performance
npm run measure-performance
```

## **Performance Optimizations**

### **Already Implemented**
- ✅ CSS bundling and minification
- ✅ JavaScript bundling and minification
- ✅ Asset optimization
- ✅ Proper caching headers
- ✅ Vite build optimization

### **Additional Optimizations Available**
- Image optimization (WebP format)
- Font preloading
- Critical CSS inlining
- Service worker for caching

## **Monitoring**

### **Key Metrics to Watch**
- Build time
- Bundle size
- Page load time
- Core Web Vitals
- Error rates

### **Tools**
- Cloudflare Analytics
- Browser DevTools
- Lighthouse audits
- WebPageTest

## **Rollback Plan**

If issues occur:
1. Revert to previous Git commit
2. Update Cloudflare Pages to use previous deployment
3. Test locally before redeploying
4. Check environment variables

## **Support**

For deployment issues:
1. Check Cloudflare Pages logs
2. Verify environment variables
3. Test locally with `npm run preview`
4. Compare with working local development 