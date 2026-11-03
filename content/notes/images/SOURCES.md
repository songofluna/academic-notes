# Chapter 5.7 figure sources

All six image files are the exact captures supplied by the site owner, without
cropping, redrawing, or other image changes. The first three were replaced with
the subsequently supplied `1.jpg`, `2.jpg`, and `3.jpg`, as requested.

The Markdown uses local `images/` links. The build copies this directory to
`dist/images/` so these links also work below `/academic-notes/` on GitHub Pages.

| File | Supplied source | Content |
| --- | --- | --- |
| raster-order.jpg | The Gradient, *Likelihood-based Generative Models I: Autoregressive Models* | Raster scan and zigzag ordering |
| mask-a-b.jpg | [Minibatch AI, PixelCNN](https://minibatchai.com/2023/01/27/pixel-cnn.html) | RGB-channel Mask B only; the filename follows the requested naming convention |
| pixelcnn-blind-spot.jpg | Francisco Ingham, *Day 5: Conditional Image Generation with PixelCNN Decoders* (Medium) | Figure 2 from van den Oord et al., *Conditional Image Generation with PixelCNN Decoders* (2016) |
| row-lstm.jpg | 모두의연구소, *Pixel RNN to Pixel CNN++* | Complete Row LSTM slide |
| diagonal-skewing.jpg | van den Oord et al., *Pixel Recurrent Neural Networks* (2016), Figure 3 | Original figure and caption, supplied as a capture |
| diagonal-bilstm.jpg | 모두의연구소, *Pixel RNN to Pixel CNN++* | Complete Diagonal BiLSTM slide |

The two 모두의연구소 slides cite
[Jaejun Yoo, PR12: PixelRNN](https://www.slideshare.net/thinkfactory/pr12-pixelrnn-jaejun-yoo).

## License record

The original *Pixel Recurrent Neural Networks* paper is by Aäron van den Oord,
Nal Kalchbrenner, and Koray Kavukcuoglu (2016), PMLR 48:1747–1756:
[publication](https://proceedings.mlr.press/v48/oord16.html),
[PDF](https://proceedings.mlr.press/v48/oord16.pdf).
The [PMLR publication agreement](https://proceedings.mlr.press/pmlr-license-agreement.html)
specifies [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); this supports
the original Figure 3 shown in `diagonal-skewing.jpg`.

An independent reuse license was not confirmed for the other supplied captures
or for the complete lecture-slide compositions. They were specifically supplied
and selected by the site owner for this note. Source attribution is not a claim
of a verified reuse license, and the PMLR license is not extended to those files.
No new license is granted for the supplied images by this repository.
