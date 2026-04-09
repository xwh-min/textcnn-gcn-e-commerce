package inference

import "errors"

var (
	ErrModelNotLoaded      = errors.New("model not loaded")
	ErrInvalidInputSize    = errors.New("invalid input size")
	ErrInvalidOutputType   = errors.New("invalid output type")
	ErrFeatureExtraction   = errors.New("feature extraction failed")
)
