import matplotlib.pyplot as plt
import argparse

# Ref. https://en.wikipedia.org/wiki/De_Boor%27s_algorithm
def deBoor(k: int, x: int, t, c, p: int):
    """Evaluates S(x).

    Arguments
    ---------
    k: Index of knot interval that contains x.
    x: Position.
    t: Array of knot positions, needs to be padded.
    c: Array of control points.
    p: Degree of B-spline.
    """
    d = [c[j + k - p] for j in range(0, p + 1)] 

    for r in range(1, p + 1):
        for j in range(p, r - 1, -1):
            alpha = (x - t[j + k - p]) / (t[j + 1 + k - r] - t[j + k - p]) 
            d[j] = (1.0 - alpha) * d[j - 1] + alpha * d[j]

    return d[p]

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--degree", help="Polynomial degree of the B-Spline", default=2, type=int)
    parser.add_argument("--interpolate_endpoints", help="Whether to force interpolation at end points", action='store_true')
    args = parser.parse_args()

    # define control points as you like
    control_points_x = [0, 2, 5, 7]
    control_points_y = [0, 2, 1, 3]
    assert len(control_points_x) == len(control_points_y)

    # default uniform knots
    knots_padded = list(range(len(control_points_x) + args.degree + 1))

    # To enforce interpolation at the endpoint
    # We duplicate the endpoint knots #(degree + 1) times 
    if args.interpolate_endpoints:
        knots_padded[:args.degree + 1] = [0] * (args.degree + 1)
        knots_padded[-args.degree - 1:] = [len(control_points_x) + args.degree] * (args.degree + 1)

    # B-Spline are only defined on a subset of the knot intervals
    knots = knots_padded[args.degree:len(control_points_x) + 1]

    xs = []
    ys = []
    step = 0.001
    if len(knots) > 0:
        t = knots[0]
        for i, interval_end in enumerate(knots[1:]):
            cur_xs = []
            cur_ys = []
            interval_id = i + args.degree
            while t < interval_end:
                x = deBoor(interval_id, t, knots_padded, control_points_x, args.degree)
                y = deBoor(interval_id, t, knots_padded, control_points_y, args.degree)
                cur_xs.append(x)
                cur_ys.append(y)
                t += step
            xs.append(cur_xs)
            ys.append(cur_ys)
    
    # ploting
    plt.plot(control_points_x, control_points_y, '--', color='red')
    plt.scatter(control_points_x, control_points_y, color='orange')

    # visualize different knot interval with different color
    color_arrays = ['blue', 'green']
    for i in range(len(xs)):
        plt.scatter(xs[i], ys[i], color=color_arrays[i % len(color_arrays)], s=10)

    if args.interpolate_endpoints:
        plt.title(f"{args.degree}-degree B-Splines enforcing endpoint interpolation")
    else:
        plt.title(f"{args.degree}-degree uniform B-Splines")
    plt.show()