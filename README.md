# Implement a Lambda Function to Serve as a Cloudinary Remote function.

This function call be called via Cloudinary URL as a remote function. The remote function provides a custom transformation.  

In this example, the transformation is a text overlay showing the time the transformation was called and the derived iamge cached.  

You can create a signed function (backend only) that calls a remote function to add a custom transformation. In this example 
we add the date cached as an image overlay. This is a derived image that will get cached as it is delivered to the requesting user.  


![Sample Output](https://res.cloudinary.com/cloudinary-training/image/upload/s--yNr9BQDd--/fn_remote:aHR0cHM6Ly9zaGlueS1jbGQtcmVtb3RlLm5ldGxpZnkuYXBwLy5uZXRsaWZ5L2Z1bmN0aW9ucy9yZW1vdGUtb3ZlcmxheQ/bo_15px_solid_coral/cld-sample)

## Netlify Function

The code is implemented and served as a Netlify function here: 

You can test locally, by installing the Netlify CLI and starting a local server:

```zsh
netlify functions:serve
```
### Test with Postman

Then go to Postman and test by setting the following options.  Note that the `file` key is a file type that you choose from your local file system.

![Postman test](postman-test.png)

### Test with cURL


```bash
curl --location --request POST 'https://shiny-cld-remote.netlify.app/.netlify/functions/remote-overlay' \
--form 'file=@"./sample.png"'
```
