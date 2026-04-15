package inference

import (
	"context"
	"fmt"
)

type CompositePredictor struct {
	primary Predictor
	fallback Predictor
	strict bool
}

func NewCompositePredictor(primary Predictor, fallback Predictor, strict bool) Predictor {
	return &CompositePredictor{
		primary:  primary,
		fallback: fallback,
		strict:   strict,
	}
}

func (c *CompositePredictor) Backend() string {
	if c.primary == nil {
		return "unknown"
	}
	if c.fallback == nil {
		return c.primary.Backend()
	}
	return fmt.Sprintf("%s(with-fallback:%s)", c.primary.Backend(), c.fallback.Backend())
}

func (c *CompositePredictor) IsMock() bool {
	if c.primary == nil {
		return true
	}
	return c.primary.IsMock()
}

func (c *CompositePredictor) Predict(input []float32) ([]float32, error) {
	return c.PredictWithPayload(context.Background(), InferencePayload{Features: input})
}

func (c *CompositePredictor) PredictWithPayload(ctx context.Context, payload InferencePayload) ([]float32, error) {
	if c.primary == nil {
		return nil, fmt.Errorf("primary predictor is nil")
	}

	result, err := c.primary.PredictWithPayload(ctx, payload)
	if err == nil {
		return result, nil
	}

	if c.strict || c.fallback == nil {
		return nil, err
	}

	return c.fallback.PredictWithPayload(ctx, payload)
}

func (c *CompositePredictor) Health(ctx context.Context) error {
	if c.primary == nil {
		return fmt.Errorf("primary predictor is nil")
	}
	return c.primary.Health(ctx)
}

func (c *CompositePredictor) Close() error {
	if c.primary != nil {
		_ = c.primary.Close()
	}
	if c.fallback != nil {
		_ = c.fallback.Close()
	}
	return nil
}
