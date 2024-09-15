# [viscomp2023](https://cvg.ethz.ch/lectures/Visual-Computing/)
Github repository for the Visual Computing course 2024 at ETH Zurich.

## Requirements for the Vision Part:
- [Python 3](https://www.python.org/downloads/).
- [Jupyter notebook](https://jupyter.org/install).

Before your first use, launch and run the notebook [version_control.ipynb](https://github.com/tavisualcomputing/viscomp2023/blob/master/version_control.ipynb) (needs to be done only once and for all).

### Alternative to Jupyter notebooks
If you don't want to bother with Git and installing all the necessary Python libraries on your computer, consider using [Google Colab](https://colab.research.google.com/notebooks/intro.ipynb). It offers an online notebook service that can install libraries, store files and runs in the cloud.
- Go to "File" -> "Open notebook" -> "GitHub" tab
- Enter the URL of this repo in the search field: "https://github.com/tavisualcomputing/viscomp2024"
- Click on the notebook you want to use.
- You then need to import all the additional files in the project: on the left panel, go to "Files" and click on the import icon. Import all the images and videos from this GitHub repository that are next to the exercise notebook (e.g. for exercise 2, import bluescreen.avi, jugglingBG.avi, jugglingTest.avi and mask.bmp). For this, you first need to download the GitHub repository and all its files on your laptop, then reupload all the files on Colab.
- You can then directly run the notebook in your navigator.

## Requirements for the Graphics Part:

We highly recommend using VisualStudio Code for solving the exercises, though you are free to choose any IDE. 

To see the output of your code while solving the exercises, please follow one of the steps below:

- VS Code: We recommend installing the `vscode-preview-server` extension so you can preview the output inside VS Code by simply right-clicking on the `.html` and selecting either "Launch on browser" or "Preview on side panel".
- Python3: To start a local web server, go to the directory in which the `.html` is located and run `python -m http.server`. Then, open `http://localhost:8000` in the web browser of your choosing to see the output. You can specify a different port number by just adding a different number to the python command.
- There is a ton of other options you will surely find online. :) 

Note: Some browsers or versions may not be supported. Please check the WebGL initialization part of the code in the respective exercises for details or approach us in the exercise sessions. We are happy to help!

Extensions: If you are using VisualStudio Code, we recommend using the "WebGL GLSL Editor" extension for proper syntax highlighting, which will prove useful along the way.
